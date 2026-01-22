'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWeb3Wallet } from './useWeb3Wallet';

/**
 * Wallet hook for Linera Dominion
 * 
 * Uses Web3 wallet (MetaMask) to derive a deterministic Linera identity.
 * This allows users to keep their progress across sessions.
 */
export function useWallet() {
  const { 
    connected, 
    chainId, 
    isConnecting, 
    walletError,
    setConnection, 
    setConnecting, 
    setWalletError,
    disconnect: storeDisconnect
  } = useGameStore();

  const web3Wallet = useWeb3Wallet();

  // Track if adapter is loaded (client-side only)
  const [adapterLoaded, setAdapterLoaded] = useState(false);
  // Track Web3 address for display
  const [web3Address, setWeb3Address] = useState<string | null>(null);
  // Track if we've already attempted restore
  const restoreAttemptedRef = useRef(false);
  const isRestoringRef = useRef(false);

  // Load the adapter on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdapterLoaded(true);
    }
  }, []);

  /**
   * Connect wallet using Web3 signature for persistent identity
   */
  const connectWallet = useCallback(async () => {
    if (isConnecting || connected) return;
    
    setConnecting(true);
    setWalletError(null);
    
    try {
      // Step 1: Connect Web3 wallet and sign message
      console.log('🦊 Connecting Web3 wallet...');
      const web3Result = await web3Wallet.connectAndSign();
      
      if (!web3Result) {
        throw new Error('Web3 wallet connection cancelled');
      }

      const { address, seed } = web3Result;
      setWeb3Address(address);
      
      // Step 2: Connect to Linera using the deterministic seed
      console.log('🔄 Connecting to Linera with persistent identity...');
      const { lineraAdapter } = await import('@/lib/linera');
      
      const connection = await lineraAdapter.connectWithSeed(seed, address);
      
      if (connection.chainId) {
        // Update the store
        const appId = lineraAdapter.getApplicationId();
        setConnection(connection.chainId, appId);
        
        console.log('✅ Connected to Linera with persistent identity!');
        console.log(`   Web3 Address: ${address}`);
        console.log(`   Chain ID: ${connection.chainId}`);
        console.log(`   App ID: ${appId || '(not set)'}`);
        
        // Try to connect to the application
        if (appId) {
          try {
            await lineraAdapter.connectApplication(appId);
            console.log('✅ Connected to Dominion application!');
          } catch (appError) {
            console.warn('⚠️ Could not connect to application:', appError);
          }
        }
        
        return connection.chainId;
      } else {
        throw new Error('No chain ID received');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setWalletError(errorMessage);
      console.error('❌ Wallet connection failed:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [isConnecting, connected, setConnecting, setWalletError, setConnection, web3Wallet]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(async () => {
    try {
      const { lineraAdapter } = await import('@/lib/linera');
      lineraAdapter.disconnect();
    } catch (e) {
      // Ignore import errors during disconnect
    }
    
    // Disconnect Web3 wallet (clears stored signature)
    web3Wallet.disconnect();
    setWeb3Address(null);
    
    // Clear old localStorage items
    localStorage.removeItem('linera_chain_id');
    localStorage.removeItem('linera_connected');
    localStorage.removeItem('linera_user_address');
    
    storeDisconnect();
  }, [storeDisconnect, web3Wallet]);

  /**
   * Clear cache and fully reset wallet
   */
  const clearWalletCache = useCallback(async () => {
    try {
      const { lineraAdapter } = await import('@/lib/linera');
      await lineraAdapter.clearCache();
    } catch (e) {
      // Ignore import errors during clear
    }
    
    web3Wallet.disconnect();
    setWeb3Address(null);
    
    localStorage.removeItem('linera_chain_id');
    localStorage.removeItem('linera_connected');
    localStorage.removeItem('linera_user_address');
    storeDisconnect();
  }, [storeDisconnect, web3Wallet]);

  /**
   * Restore connection from stored Web3 signature
   * This should only be called once on mount
   */
  const restoreConnection = useCallback(async () => {
    // Prevent multiple restore attempts
    if (restoreAttemptedRef.current || isRestoringRef.current) {
      console.log('⏭️ Restore already attempted or in progress, skipping...');
      return false;
    }
    
    // Mark as attempting
    restoreAttemptedRef.current = true;
    isRestoringRef.current = true;
    
    try {
      // Check if we have a stored Web3 session
      const storedSession = web3Wallet.checkStoredSession();
      
      if (storedSession) {
        console.log('📂 Found stored Web3 session, reconnecting...');
        setWeb3Address(storedSession.address);
        
        // Auto-reconnect with stored seed
        setConnecting(true);
        try {
          const { lineraAdapter } = await import('@/lib/linera');
          const connection = await lineraAdapter.connectWithSeed(
            storedSession.seed, 
            storedSession.address
          );
          
          const appId = lineraAdapter.getApplicationId();
          setConnection(connection.chainId, appId);
          
          console.log('✅ Restored connection!');
          console.log(`   Chain ID: ${connection.chainId}`);
          
          // Connect to application
          if (appId) {
            try {
              await lineraAdapter.connectApplication(appId);
              console.log('✅ Connected to Dominion application!');
            } catch (appError) {
              console.warn('⚠️ Could not connect to application:', appError);
            }
          }
          
          return true;
        } catch (error) {
          console.error('❌ Failed to restore connection:', error);
          web3Wallet.disconnect();
          setWeb3Address(null);
          return false;
        } finally {
          setConnecting(false);
        }
      }
      
      return false;
    } finally {
      isRestoringRef.current = false;
    }
  }, [web3Wallet, setConnecting, setConnection]);

  // Get shortened chain ID for display
  const shortChainId = chainId 
    ? `${chainId.slice(0, 8)}...${chainId.slice(-6)}`
    : null;

  // Get shortened Web3 address for display
  const shortWeb3Address = web3Address
    ? `${web3Address.slice(0, 6)}...${web3Address.slice(-4)}`
    : null;

  return {
    connected,
    chainId,
    shortChainId,
    web3Address,
    shortWeb3Address,
    isConnecting,
    walletError,
    adapterLoaded,
    connectWallet,
    disconnectWallet,
    clearWalletCache,
    restoreConnection,
  };
}
