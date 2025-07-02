# Phase 1: Foundation & Architecture

## 🎯 Phase Overview
**Duration**: Week 1-2  
**Goal**: Establish solid foundation and architecture for TumaDirect

## 📋 Deliverables

### 1. Project Setup and Development Environment

#### 1.1 Development Environment Setup
```bash
# Install required tools
brew install node@18
brew install flutter
brew install foundry
npm install -g hardhat

# Verify installations
node --version  # Should be 18+
flutter --version  # Should be 3.10+
forge --version  # Should be latest
npx hardhat --version  # Should be latest
```

#### 1.2 Repository Setup
```bash
# Initialize git repository
git init
git add .
git commit -m "Initial commit: TumaDirect project structure"

# Create development branches
git checkout -b develop
git checkout -b feature/smart-contracts
git checkout -b feature/cdp-integration
git checkout -b feature/backend-api
```

#### 1.3 Environment Configuration
Create `.env.example` with all required environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/tuma_direct
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Coinbase CDP
COINBASE_CLIENT_ID=your_coinbase_client_id
COINBASE_CLIENT_SECRET=your_coinbase_client_secret
COINBASE_REDIRECT_URI=http://localhost:3000/auth/callback

# Mobile Money APIs
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_BUSINESS_SHORT_CODE=your_business_short_code

# Blockchain Networks
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_project_id
POLYGON_RPC_URL=https://polygon-rpc.com
ALEO_RPC_URL=https://api.explorer.aleo.org/v1

# Private Keys (Development Only)
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
TREASURY_PRIVATE_KEY=your_treasury_private_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### 2. Smart Contract Architecture Design

#### 2.1 Core Contract Architecture

```solidity
// contracts/core/TumaDirectCore.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TumaDirectCore is ReentrancyGuard, Ownable {
    // Events
    event TransactionInitiated(
        bytes32 indexed transactionId,
        address indexed user,
        uint256 amount,
        string currency,
        TransactionType transactionType
    );
    
    event TransactionCompleted(
        bytes32 indexed transactionId,
        address indexed user,
        uint256 amount,
        string currency,
        TransactionType transactionType
    );
    
    event TransactionFailed(
        bytes32 indexed transactionId,
        address indexed user,
        string reason
    );

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
    }

    // State Variables
    mapping(bytes32 => Transaction) public transactions;
    mapping(address => bytes32[]) public userTransactions;
    mapping(string => bool) public supportedCurrencies;
    mapping(string => address) public currencyContracts;
    
    uint256 public transactionFee = 50; // 0.5% in basis points
    uint256 public minTransactionAmount = 100; // 100 KES
    uint256 public maxTransactionAmount = 1000000; // 1M KES
    
    address public treasury;
    uint256 public totalVolume;
    uint256 public totalTransactions;

    // Modifiers
    modifier onlyValidAmount(uint256 amount) {
        require(amount >= minTransactionAmount, "Amount too small");
        require(amount <= maxTransactionAmount, "Amount too large");
        _;
    }

    modifier onlySupportedCurrency(string memory currency) {
        require(supportedCurrencies[currency], "Currency not supported");
        _;
    }

    // Constructor
    constructor(address _treasury) {
        treasury = _treasury;
        _setupSupportedCurrencies();
    }

    // Core Functions
    function initiateTransaction(
        uint256 amount,
        string memory sourceCurrency,
        string memory targetCurrency,
        TransactionType transactionType
    ) external onlyValidAmount(amount) onlySupportedCurrency(sourceCurrency) onlySupportedCurrency(targetCurrency) returns (bytes32) {
        bytes32 transactionId = _generateTransactionId(msg.sender, amount, sourceCurrency);
        
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
            isProcessed: false
        });
        
        transactions[transactionId] = newTransaction;
        userTransactions[msg.sender].push(transactionId);
        totalTransactions++;
        
        emit TransactionInitiated(transactionId, msg.sender, amount, sourceCurrency, transactionType);
        
        return transactionId;
    }

    function processTransaction(bytes32 transactionId, string memory externalReference) external onlyOwner {
        Transaction storage transaction = transactions[transactionId];
        require(transaction.id != bytes32(0), "Transaction not found");
        require(transaction.status == TransactionStatus.PENDING, "Transaction not pending");
        
        transaction.status = TransactionStatus.PROCESSING;
        transaction.externalReference = externalReference;
        
        // Calculate fees
        uint256 feeAmount = (transaction.amount * transactionFee) / 10000;
        uint256 netAmount = transaction.amount - feeAmount;
        
        // Transfer fees to treasury
        if (feeAmount > 0) {
            // Implementation depends on currency type
            _transferFees(transaction.sourceCurrency, feeAmount);
        }
        
        transaction.status = TransactionStatus.COMPLETED;
        transaction.isProcessed = true;
        totalVolume += transaction.amount;
        
        emit TransactionCompleted(
            transactionId,
            transaction.user,
            netAmount,
            transaction.targetCurrency,
            transaction.transactionType
        );
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
        // Implementation for fee transfer
        // This would handle different currency types
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

    // Admin Functions
    function updateTransactionFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee too high"); // Max 5%
        transactionFee = newFee;
    }

    function updateLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin < newMax, "Invalid limits");
        minTransactionAmount = newMin;
        maxTransactionAmount = newMax;
    }

    function addSupportedCurrency(string memory currency, address contractAddress) external onlyOwner {
        supportedCurrencies[currency] = true;
        currencyContracts[currency] = contractAddress;
    }

    function removeSupportedCurrency(string memory currency) external onlyOwner {
        supportedCurrencies[currency] = false;
        delete currencyContracts[currency];
    }
}
```

#### 2.2 Bridge Contract for Cross-Chain Operations

```solidity
// contracts/bridge/TumaDirectBridge.sol
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract TumaDirectBridge is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // Events
    event BridgeInitiated(
        bytes32 indexed bridgeId,
        address indexed user,
        uint256 amount,
        string sourceNetwork,
        string targetNetwork,
        string currency
    );

    event BridgeCompleted(
        bytes32 indexed bridgeId,
        address indexed user,
        uint256 amount,
        string sourceNetwork,
        string targetNetwork,
        string currency
    );

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
    }

    // State Variables
    mapping(bytes32 => BridgeRequest) public bridgeRequests;
    mapping(string => bool) public supportedNetworks;
    mapping(string => address) public networkContracts;
    mapping(address => bytes32[]) public userBridges;

    uint256 public bridgeFee = 25; // 0.25% in basis points
    uint256 public minBridgeAmount = 1000; // 1000 KES equivalent
    uint256 public maxBridgeAmount = 10000000; // 10M KES equivalent

    address public treasury;
    uint256 public totalBridgedVolume;

    // Modifiers
    modifier onlySupportedNetwork(string memory network) {
        require(supportedNetworks[network], "Network not supported");
        _;
    }

    modifier onlyValidBridgeAmount(uint256 amount) {
        require(amount >= minBridgeAmount, "Bridge amount too small");
        require(amount <= maxBridgeAmount, "Bridge amount too large");
        _;
    }

    // Constructor
    constructor(address _treasury) {
        treasury = _treasury;
        _setupSupportedNetworks();
    }

    // Core Functions
    function initiateBridge(
        uint256 amount,
        string memory sourceNetwork,
        string memory targetNetwork,
        string memory currency
    ) external onlyValidBridgeAmount(amount) onlySupportedNetwork(sourceNetwork) onlySupportedNetwork(targetNetwork) returns (bytes32) {
        bytes32 bridgeId = _generateBridgeId(msg.sender, amount, sourceNetwork, targetNetwork);
        
        BridgeRequest memory newBridge = BridgeRequest({
            id: bridgeId,
            user: msg.sender,
            amount: amount,
            sourceNetwork: sourceNetwork,
            targetNetwork: targetNetwork,
            currency: currency,
            isCompleted: false,
            timestamp: block.timestamp,
            externalReference: ""
        });
        
        bridgeRequests[bridgeId] = newBridge;
        userBridges[msg.sender].push(bridgeId);
        
        // Lock tokens on source network
        _lockTokens(currency, amount, msg.sender);
        
        emit BridgeInitiated(bridgeId, msg.sender, amount, sourceNetwork, targetNetwork, currency);
        
        return bridgeId;
    }

    function completeBridge(bytes32 bridgeId, string memory externalReference) external onlyOwner {
        BridgeRequest storage bridge = bridgeRequests[bridgeId];
        require(bridge.id != bytes32(0), "Bridge request not found");
        require(!bridge.isCompleted, "Bridge already completed");
        
        // Calculate fees
        uint256 feeAmount = (bridge.amount * bridgeFee) / 10000;
        uint256 netAmount = bridge.amount - feeAmount;
        
        // Transfer fees
        if (feeAmount > 0) {
            _transferBridgeFees(bridge.currency, feeAmount);
        }
        
        // Release tokens on target network
        _releaseTokens(bridge.currency, netAmount, bridge.user, bridge.targetNetwork);
        
        bridge.isCompleted = true;
        bridge.externalReference = externalReference;
        totalBridgedVolume += bridge.amount;
        
        emit BridgeCompleted(
            bridgeId,
            bridge.user,
            netAmount,
            bridge.sourceNetwork,
            bridge.targetNetwork,
            bridge.currency
        );
    }

    // Internal Functions
    function _generateBridgeId(
        address user,
        uint256 amount,
        string memory sourceNetwork,
        string memory targetNetwork
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(user, amount, sourceNetwork, targetNetwork, block.timestamp));
    }

    function _setupSupportedNetworks() internal {
        supportedNetworks["ethereum"] = true;
        supportedNetworks["polygon"] = true;
        supportedNetworks["aleo"] = true;
        supportedNetworks["mpesa"] = true;
    }

    function _lockTokens(string memory currency, uint256 amount, address user) internal {
        // Implementation for locking tokens on source network
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts["ethereum"]);
            usdc.safeTransferFrom(user, address(this), amount);
        }
        // Add other currency implementations
    }

    function _releaseTokens(string memory currency, uint256 amount, address user, string memory targetNetwork) internal {
        // Implementation for releasing tokens on target network
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts[targetNetwork]);
            usdc.safeTransfer(user, amount);
        }
        // Add other currency implementations
    }

    function _transferBridgeFees(string memory currency, uint256 amount) internal {
        // Transfer bridge fees to treasury
        if (keccak256(bytes(currency)) == keccak256(bytes("USDC"))) {
            IERC20 usdc = IERC20(networkContracts["ethereum"]);
            usdc.safeTransfer(treasury, amount);
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

    // Admin Functions
    function updateBridgeFee(uint256 newFee) external onlyOwner {
        require(newFee <= 250, "Bridge fee too high"); // Max 2.5%
        bridgeFee = newFee;
    }

    function updateBridgeLimits(uint256 newMin, uint256 newMax) external onlyOwner {
        require(newMin < newMax, "Invalid limits");
        minBridgeAmount = newMin;
        maxBridgeAmount = newMax;
    }

    function addSupportedNetwork(string memory network, address contractAddress) external onlyOwner {
        supportedNetworks[network] = true;
        networkContracts[network] = contractAddress;
    }
}
```

### 3. CDP Integration Planning

#### 3.1 Coinbase Developer Platform Integration Strategy

**Wallets API Integration:**
- Implement Coinbase Wallet SDK for mobile and web
- Handle wallet connection, account management, and transaction signing
- Support multiple wallet types (Coinbase Wallet, MetaMask, WalletConnect)

**Onramp API Integration:**
- Integrate Coinbase Onramp for KES to USDC conversion
- Handle payment methods (M-Pesa, bank transfers, cards)
- Implement webhook handling for transaction status updates

**Swap API Integration:**
- Enable in-app token swapping (USDC ↔ cUSD, USDC ↔ ETH)
- Implement price feeds and slippage protection
- Handle swap confirmations and failures

#### 3.2 CDP Integration Architecture

```typescript
// backend/src/services/cdp/CoinbaseCDPService.ts
import { CoinbaseWallet } from '@coinbase/wallet-sdk';
import { OnrampClient } from '@coinbase/onramp-client';
import { SwapClient } from '@coinbase/swap-client';

export class CoinbaseCDPService {
    private wallet: CoinbaseWallet;
    private onrampClient: OnrampClient;
    private swapClient: SwapClient;

    constructor() {
        this.initializeCDPServices();
    }

    private async initializeCDPServices() {
        // Initialize Coinbase Wallet SDK
        this.wallet = new CoinbaseWallet({
            appName: 'TumaDirect',
            appLogoUrl: 'https://tuma-direct.com/logo.png',
            darkMode: false,
            overrideIsMetaMask: false,
            enableMobileWalletLink: true,
        });

        // Initialize Onramp Client
        this.onrampClient = new OnrampClient({
            apiKey: process.env.COINBASE_CLIENT_ID,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        });

        // Initialize Swap Client
        this.swapClient = new SwapClient({
            apiKey: process.env.COINBASE_CLIENT_ID,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
        });
    }

    // Wallet Management
    async connectWallet(): Promise<string> {
        try {
            const accounts = await this.wallet.request({ method: 'eth_requestAccounts' });
            return accounts[0];
        } catch (error) {
            throw new Error(`Failed to connect wallet: ${error.message}`);
        }
    }

    async getWalletBalance(address: string, currency: string): Promise<string> {
        try {
            if (currency === 'ETH') {
                const balance = await this.wallet.request({
                    method: 'eth_getBalance',
                    params: [address, 'latest'],
                });
                return balance;
            } else {
                // Handle ERC-20 tokens
                const tokenContract = this.getTokenContract(currency);
                const balance = await tokenContract.balanceOf(address);
                return balance.toString();
            }
        } catch (error) {
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    // Onramp Integration
    async createOnrampSession(
        amount: string,
        sourceCurrency: string,
        targetCurrency: string,
        walletAddress: string
    ): Promise<any> {
        try {
            const session = await this.onrampClient.createSession({
                amount,
                sourceCurrency,
                targetCurrency,
                walletAddress,
                supportedNetworks: ['ethereum', 'polygon'],
                supportedPaymentMethods: ['mpesa', 'bank_transfer', 'card'],
                redirectUrl: `${process.env.FRONTEND_URL}/onramp/callback`,
            });
            return session;
        } catch (error) {
            throw new Error(`Failed to create onramp session: ${error.message}`);
        }
    }

    async getOnrampStatus(sessionId: string): Promise<any> {
        try {
            const status = await this.onrampClient.getSessionStatus(sessionId);
            return status;
        } catch (error) {
            throw new Error(`Failed to get onramp status: ${error.message}`);
        }
    }

    // Swap Integration
    async createSwapQuote(
        fromCurrency: string,
        toCurrency: string,
        amount: string,
        walletAddress: string
    ): Promise<any> {
        try {
            const quote = await this.swapClient.createQuote({
                fromCurrency,
                toCurrency,
                amount,
                walletAddress,
                slippageTolerance: 0.5, // 0.5%
            });
            return quote;
        } catch (error) {
            throw new Error(`Failed to create swap quote: ${error.message}`);
        }
    }

    async executeSwap(quoteId: string, walletAddress: string): Promise<any> {
        try {
            const swap = await this.swapClient.executeSwap(quoteId, walletAddress);
            return swap;
        } catch (error) {
            throw new Error(`Failed to execute swap: ${error.message}`);
        }
    }

    async getSwapStatus(swapId: string): Promise<any> {
        try {
            const status = await this.swapClient.getSwapStatus(swapId);
            return status;
        } catch (error) {
            throw new Error(`Failed to get swap status: ${error.message}`);
        }
    }

    private getTokenContract(currency: string) {
        // Implementation for getting token contract addresses
        const tokenAddresses = {
            USDC: '0xA0b86a33E6441b8C4C8C8C8C8C8C8C8C8C8C8C8',
            CUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
        };
        return tokenAddresses[currency];
    }
}
```

### 4. Database Schema Design

#### 4.1 PostgreSQL Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    national_id VARCHAR(20) UNIQUE,
    wallet_address VARCHAR(42),
    kyc_status VARCHAR(20) DEFAULT 'pending',
    kyc_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id VARCHAR(66) UNIQUE,
    user_id UUID REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL, -- 'onramp', 'offramp', 'swap', 'transfer'
    source_currency VARCHAR(10) NOT NULL,
    target_currency VARCHAR(10) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee_amount DECIMAL(20,8) DEFAULT 0,
    net_amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    source_network VARCHAR(20),
    target_network VARCHAR(20),
    external_reference VARCHAR(255),
    cdp_session_id VARCHAR(255),
    wallet_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bridge transactions table
CREATE TABLE bridge_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id VARCHAR(66) UNIQUE,
    user_id UUID REFERENCES users(id),
    source_network VARCHAR(20) NOT NULL,
    target_network VARCHAR(20) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee_amount DECIMAL(20,8) DEFAULT 0,
    net_amount DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    external_reference VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Mobile money transactions table
CREATE TABLE mobile_money_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    provider VARCHAR(20) NOT NULL, -- 'mpesa', 'airtel_money'
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    reference_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User wallets table
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    wallet_type VARCHAR(20) NOT NULL, -- 'coinbase', 'metamask', 'walletconnect'
    wallet_address VARCHAR(42) NOT NULL,
    network VARCHAR(20) NOT NULL, -- 'ethereum', 'polygon', 'aleo'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Exchange rates table
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_currency VARCHAR(10) NOT NULL,
    target_currency VARCHAR(10) NOT NULL,
    rate DECIMAL(20,8) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'coinbase', 'binance', 'manual'
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_bridge_transactions_user_id ON bridge_transactions(user_id);
CREATE INDEX idx_mobile_money_transactions_transaction_id ON mobile_money_transactions(transaction_id);
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(source_currency, target_currency);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 5. API Architecture Planning

#### 5.1 RESTful API Design

```typescript
// backend/src/routes/api.ts
import express from 'express';
import authRoutes from './auth';
import transactionRoutes from './transactions';
import walletRoutes from './wallets';
import bridgeRoutes from './bridge';
import mobileMoneyRoutes from './mobile-money';
import cdpRoutes from './cdp';

const router = express.Router();

// API Versioning
router.use('/v1/auth', authRoutes);
router.use('/v1/transactions', transactionRoutes);
router.use('/v1/wallets', walletRoutes);
router.use('/v1/bridge', bridgeRoutes);
router.use('/v1/mobile-money', mobileMoneyRoutes);
router.use('/v1/cdp', cdpRoutes);

export default router;
```

#### 5.2 API Endpoints Structure

```typescript
// Authentication Endpoints
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/verify-phone
POST   /api/v1/auth/kyc-submit

// Transaction Endpoints
POST   /api/v1/transactions/onramp
POST   /api/v1/transactions/offramp
POST   /api/v1/transactions/swap
POST   /api/v1/transactions/transfer
GET    /api/v1/transactions
GET    /api/v1/transactions/:id
GET    /api/v1/transactions/user/:userId

// Wallet Endpoints
POST   /api/v1/wallets/connect
GET    /api/v1/wallets/balance
GET    /api/v1/wallets/addresses
POST   /api/v1/wallets/primary

// Bridge Endpoints
POST   /api/v1/bridge/initiate
POST   /api/v1/bridge/complete
GET    /api/v1/bridge/status/:id
GET    /api/v1/bridge/user/:userId

// Mobile Money Endpoints
POST   /api/v1/mobile-money/mpesa/initiate
POST   /api/v1/mobile-money/mpesa/callback
POST   /api/v1/mobile-money/airtel/initiate
POST   /api/v1/mobile-money/airtel/callback

// CDP Endpoints
POST   /api/v1/cdp/onramp/session
GET    /api/v1/cdp/onramp/status/:sessionId
POST   /api/v1/cdp/swap/quote
POST   /api/v1/cdp/swap/execute
GET    /api/v1/cdp/swap/status/:swapId
```

## 🎯 Next Steps

1. **Set up development environment** with all required tools
2. **Initialize smart contracts** with Hardhat and Foundry
3. **Create database schema** and migrations
4. **Set up CDP integration** with Coinbase APIs
5. **Begin backend API development**

## 📚 Resources

- [Coinbase Developer Platform Documentation](https://docs.cloud.coinbase.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs) 