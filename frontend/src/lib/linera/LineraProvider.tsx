'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { lineraAdapter } from './lineraAdapter';

/**
 * Linera Context Interface
 */
interface LineraContextType {
  isConnected: boolean;
  isAppConnected: boolean;
  isConnecting: boolean;
  chainId: string | null;
  error: string | null;
  mutate: <T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
  query: <T = unknown>(
    graphqlQuery: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
  connect: (userAddress: string) => Promise<void>;
  disconnect: () => void;
}

const LineraContext = createContext<LineraContextType | null>(null);

/**
 * Linera Provider Props
 */
interface LineraProviderProps {
  children: ReactNode;
}

/**
 * Linera Provider Component
 * Provides Linera connection state and methods to the app
 */
export function LineraProvider({ children }: LineraProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isAppConnected, setIsAppConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to adapter state changes
  useEffect(() => {
    const handleStateChange = () => {
      const connection = lineraAdapter.getConnection();
      const walletConnected = lineraAdapter.isConnected();
      const appConnected = lineraAdapter.isApplicationConnected();
      
      setIsConnected(walletConnected);
      setIsAppConnected(appConnected);
      setChainId(connection?.chainId || null);
      
      // Debug logging
      console.log('🔄 Linera state changed:', { walletConnected, appConnected, chainId: connection?.chainId });
    };

    // Check initial state
    handleStateChange();

    // Subscribe to changes using the subscribe method
    const unsubscribe = lineraAdapter.subscribe(handleStateChange);

    // Also poll every 2 seconds to catch state changes
    const pollInterval = setInterval(handleStateChange, 2000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  // Connect function
  const connect = useCallback(async (userAddress: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      await lineraAdapter.connect(userAddress);
      setIsConnected(true);
      setChainId(lineraAdapter.getConnection()?.chainId || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setError(message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    lineraAdapter.disconnect();
    setIsConnected(false);
    setChainId(null);
  }, []);

  // Mutate function - calls contract mutations
  const mutate = useCallback(async <T = unknown>(
    mutation: string,
    variables?: Record<string, unknown>
  ): Promise<T> => {
    // Check if application is connected
    if (!lineraAdapter.isApplicationConnected()) {
      // Try to connect to app if wallet is connected
      if (lineraAdapter.isConnected()) {
        const appId = lineraAdapter.getApplicationId();
        if (appId) {
          console.log('🔄 Attempting to connect to application...');
          try {
            await lineraAdapter.connectApplication(appId);
          } catch (e) {
            console.warn('⚠️ Could not connect to application:', e);
            throw new Error('Failed to connect to Linera application');
          }
        }
      } else {
        throw new Error('Not connected to Linera - please connect wallet first');
      }
    }
    
    console.log('📤 Sending mutation:', mutation);
    console.log('📤 Variables:', variables);
    
    return lineraAdapter.mutate<T>(mutation, variables);
  }, []);

  // Query function - calls contract queries
  const query = useCallback(async <T = unknown>(
    graphqlQuery: string,
    variables?: Record<string, unknown>
  ): Promise<T> => {
    if (!lineraAdapter.isApplicationConnected()) {
      throw new Error('Not connected to Linera application');
    }
    
    return lineraAdapter.query<T>(graphqlQuery, variables);
  }, []);

  const value: LineraContextType = {
    isConnected,
    isAppConnected,
    isConnecting,
    chainId,
    error,
    mutate,
    query,
    connect,
    disconnect,
  };

  return (
    <LineraContext.Provider value={value}>
      {children}
    </LineraContext.Provider>
  );
}

/**
 * Hook to use Linera context
 */
export function useLinera(): LineraContextType {
  const context = useContext(LineraContext);
  
  if (!context) {
    // Return a default context that indicates not connected
    // This allows components to use the hook outside the provider
    return {
      isConnected: false,
      isAppConnected: false,
      isConnecting: false,
      chainId: null,
      error: null,
      mutate: async () => {
        throw new Error('LineraProvider not found');
      },
      query: async () => {
        throw new Error('LineraProvider not found');
      },
      connect: async () => {
        throw new Error('LineraProvider not found');
      },
      disconnect: () => {},
    };
  }
  
  return context;
}

export default LineraProvider;
