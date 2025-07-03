// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockTreasury
 * @dev Mock treasury contract for testing TumaDirect
 * @author TumaDirect Team
 */
contract MockTreasury is Ownable {
    using SafeERC20 for IERC20;

    // Events
    event FundsReceived(address indexed from, uint256 amount, string currency);
    event FundsWithdrawn(address indexed to, uint256 amount, string currency);

    // State Variables
    mapping(string => uint256) public balances;
    mapping(address => bool) public authorizedOperators;

    // Modifiers
    modifier onlyAuthorized() {
        require(msg.sender == owner() || authorizedOperators[msg.sender], "MockTreasury: Not authorized");
        _;
    }

    // Constructor
    constructor() {
        authorizedOperators[msg.sender] = true;
    }

    // Core Functions
    function receiveFunds(string memory currency, uint256 amount) external payable {
        if (keccak256(bytes(currency)) == keccak256(bytes("ETH")) || keccak256(bytes(currency)) == keccak256(bytes("MATIC"))) {
            require(msg.value == amount, "MockTreasury: Incorrect amount");
            balances[currency] += msg.value;
        } else {
            IERC20 token = IERC20(getTokenAddress(currency));
            token.safeTransferFrom(msg.sender, address(this), amount);
            balances[currency] += amount;
        }
        
        emit FundsReceived(msg.sender, amount, currency);
    }

    function withdrawFunds(string memory currency, uint256 amount, address recipient) external onlyAuthorized {
        require(balances[currency] >= amount, "MockTreasury: Insufficient balance");
        
        balances[currency] -= amount;
        
        if (keccak256(bytes(currency)) == keccak256(bytes("ETH")) || keccak256(bytes(currency)) == keccak256(bytes("MATIC"))) {
            payable(recipient).transfer(amount);
        } else {
            IERC20 token = IERC20(getTokenAddress(currency));
            token.safeTransfer(recipient, amount);
        }
        
        emit FundsWithdrawn(recipient, amount, currency);
    }

    function getBalance(string memory currency) external view returns (uint256) {
        return balances[currency];
    }

    function addAuthorizedOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = true;
    }

    function removeAuthorizedOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
    }

    function getTokenAddress(string memory currency) internal pure returns (address) {
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            return 0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8; // Mock USDC address
        } else if (keccak256(bytes(currency)) == keccak256(bytes("CUSD"))) {
            return 0x765DE816845861e75A25fCA122bb6898B8B1282a; // Mock cUSD address
        }
        revert("MockTreasury: Unsupported currency");
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
        balances["ETH"] += msg.value;
        emit FundsReceived(msg.sender, msg.value, "ETH");
    }
} 