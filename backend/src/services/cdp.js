const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Coinbase Developer Platform Service
 * Handles integration with CDP Wallets, Onramp, and Swap APIs
 */
class CDPService {
  constructor() {
    this.clientId = process.env.COINBASE_CLIENT_ID;
    this.clientSecret = process.env.COINBASE_CLIENT_SECRET;
    this.redirectUri = process.env.COINBASE_REDIRECT_URI;
    this.environment = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.coinbase.com' 
      : 'https://api-sandbox.coinbase.com';
    
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Initialize CDP service
   */
  async initialize() {
    try {
      logger.info('Initializing CDP service...');
      
      // Test connection
      await this.testConnection();
      
      logger.info('CDP service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CDP service:', error);
      throw error;
    }
  }

  /**
   * Test CDP connection
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/currencies`);
      logger.info(`CDP connection test successful. Available currencies: ${response.data.data.length}`);
      return true;
    } catch (error) {
      logger.error('CDP connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(state = null) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'wallet:accounts:read,wallet:transactions:read,wallet:addresses:read',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Successfully exchanged code for access token');
      return response.data;
    } catch (error) {
      logger.error('Failed to exchange code for token:', error.message);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      logger.info('Successfully refreshed access token');
      return response.data;
    } catch (error) {
      logger.error('Failed to refresh access token:', error.message);
      throw error;
    }
  }

  /**
   * Get authenticated headers
   */
  async getAuthHeaders() {
    if (!this.accessToken || (this.tokenExpiry && Date.now() >= this.tokenExpiry)) {
      await this.refreshAccessToken();
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ===== WALLET API METHODS =====

  /**
   * Get user accounts
   */
  async getAccounts() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/accounts`, { headers });
      
      logger.info(`Retrieved ${response.data.data.length} accounts`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get accounts:', error.message);
      throw error;
    }
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/accounts/${accountId}`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get account ${accountId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get account addresses
   */
  async getAccountAddresses(accountId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/accounts/${accountId}/addresses`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get addresses for account ${accountId}:`, error.message);
      throw error;
    }
  }

  /**
   * Create new address for account
   */
  async createAddress(accountId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseUrl}/v2/accounts/${accountId}/addresses`, {}, { headers });
      
      logger.info(`Created new address for account ${accountId}`);
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to create address for account ${accountId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get account transactions
   */
  async getAccountTransactions(accountId, limit = 100) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/accounts/${accountId}/transactions`, {
        headers,
        params: { limit },
      });
      
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get transactions for account ${accountId}:`, error.message);
      throw error;
    }
  }

  // ===== ONRAMP API METHODS =====

  /**
   * Create onramp session
   */
  async createOnrampSession(params) {
    try {
      const {
        amount,
        sourceCurrency,
        targetCurrency,
        walletAddress,
        supportedNetworks = ['ethereum', 'polygon'],
        supportedPaymentMethods = ['mpesa', 'bank_transfer', 'card'],
        redirectUrl,
      } = params;

      const sessionData = {
        amount,
        source_currency: sourceCurrency,
        target_currency: targetCurrency,
        wallet_address: walletAddress,
        supported_networks: supportedNetworks,
        supported_payment_methods: supportedPaymentMethods,
        redirect_url: redirectUrl,
        environment: this.environment,
      };

      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseUrl}/onramp/sessions`, sessionData, { headers });
      
      logger.info(`Created onramp session: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create onramp session:', error.message);
      throw error;
    }
  }

  /**
   * Get onramp session status
   */
  async getOnrampSessionStatus(sessionId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/onramp/sessions/${sessionId}`, { headers });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get onramp session status for ${sessionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get onramp supported currencies
   */
  async getOnrampSupportedCurrencies() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/onramp/currencies`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get onramp supported currencies:', error.message);
      throw error;
    }
  }

  // ===== SWAP API METHODS =====

  /**
   * Create swap quote
   */
  async createSwapQuote(params) {
    try {
      const {
        fromCurrency,
        toCurrency,
        amount,
        walletAddress,
        slippageTolerance = 0.5, // 0.5%
      } = params;

      const quoteData = {
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount,
        wallet_address: walletAddress,
        slippage_tolerance: slippageTolerance,
        environment: this.environment,
      };

      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseUrl}/swap/quotes`, quoteData, { headers });
      
      logger.info(`Created swap quote: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to create swap quote:', error.message);
      throw error;
    }
  }

  /**
   * Execute swap
   */
  async executeSwap(quoteId, walletAddress) {
    try {
      const swapData = {
        quote_id: quoteId,
        wallet_address: walletAddress,
      };

      const headers = await this.getAuthHeaders();
      const response = await axios.post(`${this.baseUrl}/swap/executions`, swapData, { headers });
      
      logger.info(`Executed swap: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to execute swap for quote ${quoteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/swap/executions/${swapId}`, { headers });
      
      return response.data;
    } catch (error) {
      logger.error(`Failed to get swap status for ${swapId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get swap supported currencies
   */
  async getSwapSupportedCurrencies() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/swap/currencies`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get swap supported currencies:', error.message);
      throw error;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Get exchange rates
   */
  async getExchangeRates(currency = 'USD') {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/exchange-rates?currency=${currency}`);
      return response.data.data.rates;
    } catch (error) {
      logger.error('Failed to get exchange rates:', error.message);
      throw error;
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies() {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/currencies`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get supported currencies:', error.message);
      throw error;
    }
  }

  /**
   * Validate wallet address
   */
  async validateWalletAddress(address, currency) {
    try {
      const response = await axios.post(`${this.baseUrl}/v2/addresses/validate`, {
        address,
        currency,
      });
      
      return response.data.data.valid;
    } catch (error) {
      logger.error('Failed to validate wallet address:', error.message);
      return false;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(transactionId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/transactions/${transactionId}`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error(`Failed to get transaction ${transactionId}:`, error.message);
      throw error;
    }
  }

  /**
   * Send transaction
   */
  async sendTransaction(params) {
    try {
      const {
        accountId,
        to,
        amount,
        currency,
        description = '',
      } = params;

      const transactionData = {
        to,
        amount,
        currency,
        description,
      };

      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.baseUrl}/v2/accounts/${accountId}/transactions`,
        transactionData,
        { headers }
      );
      
      logger.info(`Sent transaction: ${response.data.data.id}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to send transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(`${this.baseUrl}/v2/user`, { headers });
      
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get user profile:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const cdpService = new CDPService();

module.exports = cdpService; 