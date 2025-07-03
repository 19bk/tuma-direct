import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useWallet } from './WalletContext';

// Types
export interface Transaction {
  id: string;
  type: 'onramp' | 'offramp' | 'swap' | 'send' | 'receive';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceNetwork?: string;
  targetNetwork?: string;
  fee: string;
  netAmount: string;
  timestamp: Date;
  txHash?: string;
  externalReference?: string;
  description?: string;
}

export interface TransactionState {
  transactions: Transaction[];
  currentTransaction: Transaction | null;
  isLoading: boolean;
  error: string | null;
}

export interface TransactionContextType extends TransactionState {
  initiateTransaction: (params: InitiateTransactionParams) => Promise<string>;
  updateTransactionStatus: (id: string, status: Transaction['status'], txHash?: string) => void;
  getTransactionHistory: () => Transaction[];
  clearError: () => void;
}

export interface InitiateTransactionParams {
  type: Transaction['type'];
  amount: string;
  sourceCurrency: string;
  targetCurrency: string;
  sourceNetwork?: string;
  targetNetwork?: string;
  description?: string;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  currentTransaction: null,
  isLoading: false,
  error: null,
};

// Action types
type TransactionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'SET_CURRENT_TRANSACTION'; payload: Transaction | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_TRANSACTIONS'; payload: Transaction[] };

// Reducer
function transactionReducer(state: TransactionState, action: TransactionAction): TransactionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        currentTransaction: action.payload,
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id ? { ...tx, ...action.payload.updates } : tx
        ),
        currentTransaction:
          state.currentTransaction?.id === action.payload.id
            ? { ...state.currentTransaction, ...action.payload.updates }
            : state.currentTransaction,
      };
    case 'SET_CURRENT_TRANSACTION':
      return { ...state, currentTransaction: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'LOAD_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    default:
      return state;
  }
}

// Create context
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Provider component
export function TransactionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(transactionReducer, initialState);
  const { account } = useWallet();

  // Load transactions from localStorage on mount
  useEffect(() => {
    if (account) {
      loadTransactionsFromStorage();
    }
  }, [account]);

  const loadTransactionsFromStorage = () => {
    try {
      const stored = localStorage.getItem(`transactions_${account}`);
      if (stored) {
        const transactions = JSON.parse(stored).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        dispatch({ type: 'LOAD_TRANSACTIONS', payload: transactions });
      }
    } catch (error) {
      console.error('Failed to load transactions from storage:', error);
    }
  };

  const saveTransactionsToStorage = (transactions: Transaction[]) => {
    try {
      if (account) {
        localStorage.setItem(`transactions_${account}`, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Failed to save transactions to storage:', error);
    }
  };

  const initiateTransaction = async (params: InitiateTransactionParams): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Calculate fee (0.5% for now)
      const amount = parseFloat(params.amount);
      const fee = amount * 0.005;
      const netAmount = amount - fee;

      const transaction: Transaction = {
        id: generateTransactionId(),
        type: params.type,
        status: 'pending',
        amount: params.amount,
        sourceCurrency: params.sourceCurrency,
        targetCurrency: params.targetCurrency,
        sourceNetwork: params.sourceNetwork,
        targetNetwork: params.targetNetwork,
        fee: fee.toFixed(2),
        netAmount: netAmount.toFixed(2),
        timestamp: new Date(),
        description: params.description,
      };

      dispatch({ type: 'ADD_TRANSACTION', payload: transaction });

      // Save to localStorage
      const updatedTransactions = [transaction, ...state.transactions];
      saveTransactionsToStorage(updatedTransactions);

      // Simulate API call
      await simulateTransactionProcessing(transaction.id);

      return transaction.id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTransactionStatus = (id: string, status: Transaction['status'], txHash?: string) => {
    const updates: Partial<Transaction> = { status };
    if (txHash) {
      updates.txHash = txHash;
    }

    dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates } });

    // Update localStorage
    const updatedTransactions = state.transactions.map(tx =>
      tx.id === id ? { ...tx, ...updates } : tx
    );
    saveTransactionsToStorage(updatedTransactions);
  };

  const getTransactionHistory = (): Transaction[] => {
    return state.transactions;
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Simulate transaction processing (replace with actual API calls)
  const simulateTransactionProcessing = async (transactionId: string) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate completion
    updateTransactionStatus(transactionId, 'completed', `0x${Math.random().toString(16).substr(2, 64)}`);
  };

  const generateTransactionId = (): string => {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const value: TransactionContextType = {
    ...state,
    initiateTransaction,
    updateTransactionStatus,
    getTransactionHistory,
    clearError,
  };

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

// Hook to use transaction context
export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
} 