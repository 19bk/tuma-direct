// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TumaDirectBridge
 * @dev Bridge contract for cross-chain operations in TumaDirect
 * @author TumaDirect Team
 */
contract TumaDirectBridge is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event BridgeInitiated(
        bytes32 indexed bridgeId,
        address indexed user,
        uint256 amount,
        string sourceNetwork,
        string targetNetwork,
        string currency,
        uint256 timestamp
    );

    event BridgeCompleted(
        bytes32 indexed bridgeId,
        address indexed user,
        uint256 amount,
        string sourceNetwork,
        string targetNetwork,
        string currency,
        uint256 timestamp
    );

    event BridgeFailed(
        bytes32 indexed bridgeId,
        address indexed user,
        string reason,
        uint256 timestamp
    );

    event BridgeFeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event BridgeLimitsUpdated(uint256 oldMin, uint256 newMin, uint256 oldMax, uint256 newMax, uint256 timestamp);

    // Structs
    struct BridgeRequest {
        bytes32 id;
        address user;
        uint256 amount;
        string sourceNetwork;
        string targetNetwork;
        string currency;
        bool isCompleted;
        uint256 timestamp;
        string externalReference;
        uint256 feeAmount;
        uint256 netAmount;
        BridgeStatus status;
    }

    enum BridgeStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED }

    // State Variables
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(string => bool) public supportedNetworks;
    mapping(string => address) public networkContracts;
    mapping(address => bytes32[]) public userBridges;
    mapping(string => mapping(string => bool)) public networkPairs;

    uint256 public bridgeFee = 25; // 0.25% in basis points
    uint256 public minBridgeAmount = 1000; // 1000 KES equivalent
    uint256 public maxBridgeAmount = 10000000; // 10M KES equivalent

    address public treasury;
    uint256 public totalBridgedVolume;
    uint256 public totalBridgeFees;

    // Constants
    uint256 public constant MAX_BRIDGE_FEE = 250; // 2.5% maximum fee
    uint256 public constant BASIS_POINTS = 10000;

    // Modifiers
    modifier onlySupportedNetwork(string memory network) {
        require(supportedNetworks[network], "TumaDirectBridge: Network not supported");
        _;
    }

    modifier onlyValidBridgeAmount(uint256 amount) {
        require(amount >= minBridgeAmount, "TumaDirectBridge: Bridge amount too small");
        require(amount <= maxBridgeAmount, "TumaDirectBridge: Bridge amount too large");
        _;
    }

    modifier onlyValidBridgeRequest(bytes32 bridgeId) {
        require(bridgeRequests[bridgeId].id != bytes32(0), "TumaDirectBridge: Bridge request not found");
        _;
    }

    modifier onlyPendingBridge(bytes32 bridgeId) {
        require(bridgeRequests[bridgeId].status == BridgeStatus.PENDING, "TumaDirectBridge: Bridge not pending");
        _;
    }

    // Constructor
    constructor(address _treasury) {
        require(_treasury != address(0), "TumaDirectBridge: Invalid treasury address");
        treasury = _treasury;
        _setupSupportedNetworks();
    }

    // Core Functions
    /**
     * @dev Initiate a bridge request
     * @param amount Amount to bridge
     * @param sourceNetwork Source network
     * @param targetNetwork Target network
     * @param currency Currency to bridge
     * @return bridgeId Unique bridge identifier
     */
    function initiateBridge(
        uint256 amount,
        string memory sourceNetwork,
        string memory targetNetwork,
        string memory currency
    ) external whenNotPaused onlyValidBridgeAmount(amount) onlySupportedNetwork(sourceNetwork) onlySupportedNetwork(targetNetwork) returns (bytes32) {
        require(keccak256(bytes(sourceNetwork)) != keccak256(bytes(targetNetwork)), "TumaDirectBridge: Same network");
        require(networkPairs[sourceNetwork][targetNetwork], "TumaDirectBridge: Network pair not supported");
        
        bytes32 bridgeId = _generateBridgeId(msg.sender, amount, sourceNetwork, targetNetwork);
        
        // Calculate fees
        uint256 feeAmount = (amount * bridgeFee) / BASIS_POINTS;
        uint256 netAmount = amount - feeAmount;
        
        BridgeRequest memory newBridge = BridgeRequest({
            id: bridgeId,
            user: msg.sender,
            amount: amount,
            sourceNetwork: sourceNetwork,
            targetNetwork: targetNetwork,
            currency: currency,
            isCompleted: false,
            timestamp: block.timestamp,
            externalReference: "",
            feeAmount: feeAmount,
            netAmount: netAmount,
            status: BridgeStatus.PENDING
        });
        
        bridgeRequests[bridgeId] = newBridge;
        userBridges[msg.sender].push(bridgeId);
        
        // Lock tokens on source network
        _lockTokens(currency, amount, msg.sender);
        
        emit BridgeInitiated(bridgeId, msg.sender, amount, sourceNetwork, targetNetwork, currency, block.timestamp);
        
        return bridgeId;
    }

    /**
     * @dev Complete a bridge request
     * @param bridgeId Bridge to complete
     * @param externalReference External reference
     */
    function completeBridge(bytes32 bridgeId, string memory externalReference) external onlyOwner onlyValidBridgeRequest(bridgeId) onlyPendingBridge(bridgeId) {
        BridgeRequest storage bridge = bridgeRequests[bridgeId];
        
        bridge.status = BridgeStatus.PROCESSING;
        bridge.externalReference = externalReference;
        
        // Transfer bridge fees
        if (bridge.feeAmount > 0) {
            _transferBridgeFees(bridge.currency, bridge.feeAmount);
            totalBridgeFees += bridge.feeAmount;
        }
        
        // Release tokens on target network
        _releaseTokens(bridge.currency, bridge.netAmount, bridge.user, bridge.targetNetwork);
        
        bridge.isCompleted = true;
        bridge.status = BridgeStatus.COMPLETED;
        totalBridgedVolume += bridge.amount;
        
        emit BridgeCompleted(
            bridgeId,
            bridge.user,
            bridge.netAmount,
            bridge.sourceNetwork,
            bridge.targetNetwork,
            bridge.currency,
            block.timestamp
        );
    }

    /**
     * @dev Mark a bridge as failed
     * @param bridgeId Bridge to fail
     * @param reason Reason for failure
     */
    function failBridge(bytes32 bridgeId, string memory reason) external onlyOwner onlyValidBridgeRequest(bridgeId) onlyPendingBridge(bridgeId) {
        BridgeRequest storage bridge = bridgeRequests[bridgeId];
        
        bridge.status = BridgeStatus.FAILED;
        
        // Refund tokens to user
        _refundTokens(bridge.currency, bridge.amount, bridge.user);
        
        emit BridgeFailed(bridgeId, bridge.user, reason, block.timestamp);
    }

    /**
     * @dev Cancel a bridge request
     * @param bridgeId Bridge to cancel
     */
    function cancelBridge(bytes32 bridgeId) external onlyValidBridgeRequest(bridgeId) onlyPendingBridge(bridgeId) {
        BridgeRequest storage bridge = bridgeRequests[bridgeId];
        require(msg.sender == bridge.user || msg.sender == owner(), "TumaDirectBridge: Not authorized");
        
        bridge.status = BridgeStatus.CANCELLED;
        
        // Refund tokens to user
        _refundTokens(bridge.currency, bridge.amount, bridge.user);
        
        emit BridgeFailed(bridgeId, bridge.user, "Cancelled by user", block.timestamp);
    }

    // Internal Functions
    function _generateBridgeId(
        address user,
        uint256 amount,
        string memory sourceNetwork,
        string memory targetNetwork
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(user, amount, sourceNetwork, targetNetwork, block.timestamp, block.difficulty));
    }

    function _setupSupportedNetworks() internal {
        supportedNetworks["ethereum"] = true;
        supportedNetworks["polygon"] = true;
        supportedNetworks["aleo"] = true;
        supportedNetworks["mpesa"] = true;
        
        // Setup supported network pairs
        networkPairs["ethereum"]["polygon"] = true;
        networkPairs["polygon"]["ethereum"] = true;
        networkPairs["ethereum"]["mpesa"] = true;
        networkPairs["mpesa"]["ethereum"] = true;
        networkPairs["polygon"]["mpesa"] = true;
        networkPairs["mpesa"]["polygon"] = true;
        networkPairs["ethereum"]["aleo"] = true;
        networkPairs["aleo"]["ethereum"] = true;
    }

    function _lockTokens(string memory currency, uint256 amount, address user) internal {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts["ethereum"]);
            usdc.safeTransferFrom(user, address(this), amount);
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            IERC20 cusd = IERC20(networkContracts["polygon"]);
            cusd.safeTransferFrom(user, address(this), amount);
        } else {
            // For native tokens
            require(msg.value == amount, "TumaDirectBridge: Incorrect ETH amount");
        }
    }

    function _releaseTokens(string memory currency, uint256 amount, address user, string memory targetNetwork) internal {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts[targetNetwork]);
            usdc.safeTransfer(user, amount);
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            IERC20 cusd = IERC20(networkContracts[targetNetwork]);
            cusd.safeTransfer(user, amount);
        } else {
            // For native tokens
            payable(user).transfer(amount);
        }
    }

    function _refundTokens(string memory currency, uint256 amount, address user) internal {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts["ethereum"]);
            usdc.safeTransfer(user, amount);
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            IERC20 cusd = IERC20(networkContracts["polygon"]);
            cusd.safeTransfer(user, amount);
        } else {
            // For native tokens
            payable(user).transfer(amount);
        }
    }

    function _transferBridgeFees(string memory currency, uint256 amount) internal {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts["ethereum"]);
            usdc.safeTransfer(treasury, amount);
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            IERC20 cusd = IERC20(networkContracts["polygon"]);
            cusd.safeTransfer(treasury, amount);
        } else {
            // For native tokens
            payable(treasury).transfer(amount);
        }
    }

    // View Functions
    function getBridgeRequest(bytes32 bridgeId) external view returns (BridgeRequest memory) {
        return bridgeRequests[bridgeId];
    }

    function getUserBridges(address user) external view returns (bytes32[] memory) {
        return userBridges[user];
    }

    function getTotalBridgedVolume() external view returns (uint256) {
        return totalBridgedVolume;
    }

    function getTotalBridgeFees() external view returns (uint256) {
        return totalBridgeFees;
    }

    function getUserBridgeCount(address user) external view returns (uint256) {
        return userBridges[user].length;
    }

    function isNetworkPairSupported(string memory source, string memory target) external view returns (bool) {
        return networkPairs[source][target];
    }

    // Admin Functions
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_BRIDGE_FEE, "TumaDirectBridge: Bridge fee too high");
        uint256 oldFee = bridgeFee;
        bridgeFee = newFee;
        emit BridgeFeeUpdated(oldFee, newFee, block.timestamp);
    }

    function updateBridgeLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin < newMax, "TumaDirectBridge: Invalid limits");
        uint256 oldMin = minBridgeAmount;
        uint256 oldMax = maxBridgeAmount;
        minBridgeAmount = newMin;
        maxBridgeAmount = newMax;
        emit BridgeLimitsUpdated(oldMin, newMin, oldMax, newMax, block.timestamp);
    }

    function addSupportedNetwork(string memory network, address contractAddress) external onlyOwner {
        supportedNetworks[network] = true;
        networkContracts[network] = contractAddress;
    }

    function addNetworkPair(string memory source, string memory target) external onlyOwner {
        require(supportedNetworks[source] && supportedNetworks[target], "TumaDirectBridge: Networks not supported");
        networkPairs[source][target] = true;
    }

    function removeNetworkPair(string memory source, string memory target) external onlyOwner {
        networkPairs[source][target] = false;
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "TumaDirectBridge: Invalid treasury address");
        treasury = newTreasury;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency Functions
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    // Receive function for ETH
    receive() external payable {
        // Allow receiving ETH
    }
} 