// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title TumaDirectCore
 * @dev Core contract for TumaDirect - bridging mobile money with crypto
 * @author TumaDirect Team
 */
contract TumaDirectCore is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;

    // Events
    event TransactionInitiated(
        bytes32 indexed transactionId,
        address indexed user,
        uint256 amount,
        string currency,
        TransactionType transactionType,
        uint256 timestamp
    );
    
    event TransactionCompleted(
        bytes32 indexed transactionId,
        address indexed user,
        uint256 amount,
        string currency,
        TransactionType transactionType,
        uint256 timestamp
    );
    
    event TransactionFailed(
        bytes32 indexed transactionId,
        address indexed user,
        string reason,
        uint256 timestamp
    );

    event FeeUpdated(uint256 oldFee, uint256 newFee, uint256 timestamp);
    event LimitsUpdated(uint256 oldMin, uint256 newMin, uint256 oldMax, uint256 newMax, uint256 timestamp);
    event TreasuryUpdated(address oldTreasury, address newTreasury, uint256 timestamp);

    // Enums
    enum TransactionType { ONRAMP, OFFRAMP, SWAP, TRANSFER }
    enum TransactionStatus { PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED }

    // Structs
    struct Transaction {
        bytes32 id;
        address user;
        uint256 amount;
        string sourceCurrency;
        string targetCurrency;
        TransactionType transactionType;
        TransactionStatus status;
        uint256 timestamp;
        string externalReference;
        bool isProcessed;
        uint256 feeAmount;
        uint256 netAmount;
    }

    // State Variables
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => bytes32[]) public userTransactions;
    mapping(string => bool) public supportedCurrencies;
    mapping(string => address) public currencyContracts;
    
    uint256 public transactionFee = 50; // 0.5% in basis points
    uint256 public minTransactionAmount = 100; // 100 KES equivalent
    uint256 public maxTransactionAmount = 1000000; // 1M KES equivalent
    
    address public treasury;
    uint256 public totalVolume;
    uint256 public totalTransactions;
    uint256 public totalFeesCollected;

    // Constants
    uint256 public constant MAX_FEE = 500; // 5% maximum fee
    uint256 public constant BASIS_POINTS = 10000;

    // Modifiers
    modifier onlyValidAmount(uint256 amount) {
        require(amount >= minTransactionAmount, "TumaDirect: Amount too small");
        require(amount <= maxTransactionAmount, "TumaDirect: Amount too large");
        _;
    }

    modifier onlySupportedCurrency(string memory currency) {
        require(supportedCurrencies[currency], "TumaDirect: Currency not supported");
        _;
    }

    modifier onlyValidTransaction(bytes32 transactionId) {
        require(transactions[transactionId].id != bytes32(0), "TumaDirect: Transaction not found");
        _;
    }

    modifier onlyPendingTransaction(bytes32 transactionId) {
        require(transactions[transactionId].status == TransactionStatus.PENDING, "TumaDirect: Transaction not pending");
        _;
    }

    // Constructor
    constructor(address _treasury) {
        require(_treasury != address(0), "TumaDirect: Invalid treasury address");
        treasury = _treasury;
        _setupSupportedCurrencies();
    }

    // Core Functions
    /**
     * @dev Initiate a new transaction
     * @param amount Amount in smallest unit
     * @param sourceCurrency Source currency code
     * @param targetCurrency Target currency code
     * @param transactionType Type of transaction
     * @return transactionId Unique transaction identifier
     */
    function initiateTransaction(
        uint256 amount,
        string memory sourceCurrency,
        string memory targetCurrency,
        TransactionType transactionType
    ) external whenNotPaused onlyValidAmount(amount) onlySupportedCurrency(sourceCurrency) onlySupportedCurrency(targetCurrency) returns (bytes32) {
        bytes32 transactionId = _generateTransactionId(msg.sender, amount, sourceCurrency);
        
        // Calculate fees
        uint256 feeAmount = (amount * transactionFee) / BASIS_POINTS;
        uint256 netAmount = amount - feeAmount;
        
        Transaction memory newTransaction = Transaction({
            id: transactionId,
            user: msg.sender,
            amount: amount,
            sourceCurrency: sourceCurrency,
            targetCurrency: targetCurrency,
            transactionType: transactionType,
            status: TransactionStatus.PENDING,
            timestamp: block.timestamp,
            externalReference: "",
            isProcessed: false,
            feeAmount: feeAmount,
            netAmount: netAmount
        });
        
        transactions[transactionId] = newTransaction;
        userTransactions[msg.sender].push(transactionId);
        totalTransactions++;
        
        emit TransactionInitiated(transactionId, msg.sender, amount, sourceCurrency, transactionType, block.timestamp);
        
        return transactionId;
    }

    /**
     * @dev Process a pending transaction
     * @param transactionId Transaction to process
     * @param externalReference External reference for the transaction
     */
    function processTransaction(bytes32 transactionId, string memory externalReference) external onlyOwner onlyValidTransaction(transactionId) onlyPendingTransaction(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        
        transaction.status = TransactionStatus.PROCESSING;
        transaction.externalReference = externalReference;
        
        // Transfer fees to treasury if applicable
        if (transaction.feeAmount > 0) {
            _transferFees(transaction.sourceCurrency, transaction.feeAmount);
            totalFeesCollected += transaction.feeAmount;
        }
        
        transaction.status = TransactionStatus.COMPLETED;
        transaction.isProcessed = true;
        totalVolume += transaction.amount;
        
        emit TransactionCompleted(
            transactionId,
            transaction.user,
            transaction.netAmount,
            transaction.targetCurrency,
            transaction.transactionType,
            block.timestamp
        );
    }

    /**
     * @dev Mark a transaction as failed
     * @param transactionId Transaction to fail
     * @param reason Reason for failure
     */
    function failTransaction(bytes32 transactionId, string memory reason) external onlyOwner onlyValidTransaction(transactionId) onlyPendingTransaction(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        
        transaction.status = TransactionStatus.FAILED;
        
        emit TransactionFailed(transactionId, transaction.user, reason, block.timestamp);
    }

    /**
     * @dev Cancel a pending transaction
     * @param transactionId Transaction to cancel
     */
    function cancelTransaction(bytes32 transactionId) external onlyValidTransaction(transactionId) onlyPendingTransaction(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        require(msg.sender == transaction.user || msg.sender == owner(), "TumaDirect: Not authorized");
        
        transaction.status = TransactionStatus.CANCELLED;
        
        emit TransactionFailed(transactionId, transaction.user, "Cancelled by user", block.timestamp);
    }

    // Internal Functions
    function _generateTransactionId(
        address user,
        uint256 amount,
        string memory currency
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(user, amount, currency, block.timestamp, block.difficulty));
    }

    function _setupSupportedCurrencies() internal {
        supportedCurrencies["KES"] = true;
        supportedCurrencies["USDC"] = true;
        supportedCurrencies["CUSD"] = true;
        supportedCurrencies["ETH"] = true;
        supportedCurrencies["MATIC"] = true;
    }

    function _transferFees(string memory currency, uint256 amount) internal {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(currencyContracts["USDC"]);
            usdc.safeTransfer(treasury, amount);
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            IERC20 cusd = IERC20(currencyContracts["CUSD"]);
            cusd.safeTransfer(treasury, amount);
        } else {
            // For native tokens like ETH, MATIC
            payable(treasury).transfer(amount);
        }
    }

    // View Functions
    function getTransaction(bytes32 transactionId) external view returns (Transaction memory) {
        return transactions[transactionId];
    }

    function getUserTransactions(address user) external view returns (bytes32[] memory) {
        return userTransactions[user];
    }

    function getTransactionCount() external view returns (uint256) {
        return totalTransactions;
    }

    function getTotalVolume() external view returns (uint256) {
        return totalVolume;
    }

    function getTotalFeesCollected() external view returns (uint256) {
        return totalFeesCollected;
    }

    function getUserTransactionCount(address user) external view returns (uint256) {
        return userTransactions[user].length;
    }

    // Admin Functions
    function updateTransactionFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_FEE, "TumaDirect: Fee too high");
        uint256 oldFee = transactionFee;
        transactionFee = newFee;
        emit FeeUpdated(oldFee, newFee, block.timestamp);
    }

    function updateLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin < newMax, "TumaDirect: Invalid limits");
        uint256 oldMin = minTransactionAmount;
        uint256 oldMax = maxTransactionAmount;
        minTransactionAmount = newMin;
        maxTransactionAmount = newMax;
        emit LimitsUpdated(oldMin, newMin, oldMax, newMax, block.timestamp);
    }

    function addSupportedCurrency(string memory currency, address contractAddress) external onlyOwner {
        supportedCurrencies[currency] = true;
        currencyContracts[currency] = contractAddress;
    }

    function removeSupportedCurrency(string memory currency) external onlyOwner {
        supportedCurrencies[currency] = false;
        delete currencyContracts[currency];
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "TumaDirect: Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury, block.timestamp);
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