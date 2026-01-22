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
    web3Address: storeWeb3Address,
    isConnecting, 
    walletError,
    setConnection,
    setWeb3Address: setStoreWeb3Address,
    setConnecting, 
    setWalletError,
    disconnect: storeDisconnect,
    initializeGame
  } = useGameStore();

  const web3Wallet = useWeb3Wallet();

  // Track if adapter is loaded (client-side only)
  const [adapterLoaded, setAdapterLoaded] = useState(false);
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
      
      // Step 2: Connect to Linera using the deterministic seed
      console.log('🔄 Connecting to Linera with persistent identity...');
      const { lineraAdapter } = await import('@/lib/linera');
      
      const connection = await lineraAdapter.connectWithSeed(seed, address);
      
      if (connection.chainId) {
        // Update the store with web3Address included
        const appId = lineraAdapter.getApplicationId();
        setConnection(connection.chainId, appId, address);
        
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
      // Check if we have a stored Web3 session FIRST before showing any UI
      const storedSession = web3Wallet.checkStoredSession();
      
      if (!storedSession) {
        console.log('📭 No stored session found');
        return false;
      }
      
      console.log('📂 Found stored Web3 session, reconnecting...');
      
      // Only set connecting AFTER we confirm there's a session to restore
      setConnecting(true);
      
      try {
        const { lineraAdapter } = await import('@/lib/linera');
        const connection = await lineraAdapter.connectWithSeed(
          storedSession.seed, 
          storedSession.address
        );
        
        const appId = lineraAdapter.getApplicationId();
        // Include the web3Address in setConnection
        setConnection(connection.chainId, appId, storedSession.address);
        
        console.log('✅ Restored connection!');
        console.log(`   Web3 Address: ${storedSession.address}`);
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
        return false;
      } finally {
        setConnecting(false);
      }
    } finally {
      isRestoringRef.current = false;
    }
  }, [web3Wallet, setConnecting, setConnection]);

  // Get shortened chain ID for display
  const shortChainId = chainId 
    ? `${chainId.slice(0, 8)}...${chainId.slice(-6)}`
    : null;

  // Get shortened Web3 address for display (use store's address)
  const shortWeb3Address = storeWeb3Address
    ? `${storeWeb3Address.slice(0, 6)}...${storeWeb3Address.slice(-4)}`
    : null;

  return {
    connected,
    chainId,
    shortChainId,
    web3Address: storeWeb3Address,
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
