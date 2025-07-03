import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useWeb3React } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';
import { CoinbaseWallet } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';

// Types
export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string;
  network: string;
  provider: any;
  walletType: 'coinbase' | 'metamask' | 'walletconnect' | null;
  isLoading: boolean;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connectWallet: (type: 'coinbase' | 'metamask') => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  switchNetwork: (networkId: number) => Promise<void>;
}

// Initial state
const initialState: WalletState = {
  isConnected: false,
  account: null,
  balance: '0',
  network: 'ethereum',
  provider: null,
  walletType: null,
  isLoading: false,
  error: null,
};

// Action types
type WalletAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: { account: string; walletType: string } }
  | { type: 'SET_DISCONNECTED' }
  | { type: 'SET_BALANCE'; payload: string }
  | { type: 'SET_NETWORK'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROVIDER'; payload: any };

// Reducer
function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CONNECTED':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        walletType: action.payload.walletType as 'coinbase' | 'metamask',
        error: null,
      };
    case 'SET_DISCONNECTED':
      return {
        ...state,
        isConnected: false,
        account: null,
        balance: '0',
        walletType: null,
        provider: null,
        error: null,
      };
    case 'SET_BALANCE':
      return { ...state, balance: action.payload };
    case 'SET_NETWORK':
      return { ...state, network: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_PROVIDER':
      return { ...state, provider: action.payload };
    default:
      return state;
  }
}

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet providers
const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 137, 80001], // Ethereum, Polygon, testnets
});

let coinbaseWallet: CoinbaseWallet | null = null;

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const { activate, deactivate, account, library, chainId } = useWeb3React();

  // Initialize Coinbase Wallet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      coinbaseWallet = new CoinbaseWallet({
        appName: 'TumaDirect',
        appLogoUrl: 'https://tuma-direct.com/logo.png',
        darkMode: false,
        overrideIsMetaMask: false,
        enableMobileWalletLink: true,
      });
    }
  }, []);

  // Update state when Web3React state changes
  useEffect(() => {
    if (account && library) {
      dispatch({
        type: 'SET_CONNECTED',
        payload: { account, walletType: 'metamask' },
      });
      dispatch({ type: 'SET_PROVIDER', payload: library });
      refreshBalance();
    } else if (!account) {
      dispatch({ type: 'SET_DISCONNECTED' });
    }
  }, [account, library]);

  // Update network when chainId changes
  useEffect(() => {
    if (chainId) {
      const networkMap: { [key: number]: string } = {
        1: 'ethereum',
        137: 'polygon',
        5: 'goerli',
        80001: 'mumbai',
      };
      const network = networkMap[chainId] || 'ethereum';
      dispatch({ type: 'SET_NETWORK', payload: network });
    }
  }, [chainId]);

  const connectWallet = async (type: 'coinbase' | 'metamask') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (type === 'coinbase' && coinbaseWallet) {
        // Connect to Coinbase Wallet
        const accounts = await coinbaseWallet.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        
        dispatch({
          type: 'SET_CONNECTED',
          payload: { account, walletType: 'coinbase' },
        });
        
        // Get provider from Coinbase Wallet
        const provider = coinbaseWallet.makeWeb3Provider(
          process.env.REACT_APP_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
          1
        );
        dispatch({ type: 'SET_PROVIDER', payload: provider });
        
        // Get balance
        const balance = await provider.getBalance(account);
        dispatch({ type: 'SET_BALANCE', payload: ethers.utils.formatEther(balance) });
        
      } else if (type === 'metamask') {
        // Connect to MetaMask
        await activate(injectedConnector);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to connect wallet' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const disconnectWallet = () => {
    if (state.walletType === 'coinbase' && coinbaseWallet) {
      coinbaseWallet.disconnect();
    } else {
      deactivate();
    }
    dispatch({ type: 'SET_DISCONNECTED' });
  };

  const refreshBalance = async () => {
    if (!state.account || !state.provider) return;

    try {
      const balance = await state.provider.getBalance(state.account);
      const formattedBalance = ethers.utils.formatEther(balance);
      dispatch({ type: 'SET_BALANCE', payload: formattedBalance });
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const switchNetwork = async (networkId: number) => {
    if (!state.provider) return;

    try {
      if (state.walletType === 'coinbase' && coinbaseWallet) {
        await coinbaseWallet.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkId.toString(16)}` }],
        });
      } else {
        // MetaMask network switching
        await state.provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkId.toString(16)}` }],
        });
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch network' });
    }
  };

  const value: WalletContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    switchNetwork,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// Hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 