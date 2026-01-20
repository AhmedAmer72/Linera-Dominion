'use client';

import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * Wallet hook for Linera Dominion
 * 
 * Uses @linera/client WASM directly via the lineraAdapter.
 * Connects to Conway testnet faucet - no local linera service needed.
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
    disconnect 
  } = useGameStore();

  // Track if adapter is loaded (client-side only)
  const [adapterLoaded, setAdapterLoaded] = useState(false);

  // Load the adapter on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAdapterLoaded(true);
    }
  }, []);

  // Connect wallet - uses @linera/client WASM to claim a microchain from faucet
  const connectWallet = useCallback(async () => {
    if (isConnecting || connected) return;
    
    setConnecting(true);
    setWalletError(null);
    
    try {
      // Dynamically import the linera adapter (client-side only)
      const { lineraAdapter } = await import('@/lib/linera');
      
      // Generate a unique user address for this session
      const userAddress = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      // Connect to Linera via WASM client
      // This will:
      // 1. Initialize WASM
      // 2. Connect to Conway faucet
      // 3. Create a wallet
      // 4. Claim a microchain
      console.log('🔄 Connecting to Linera via WASM client...');
      const connection = await lineraAdapter.connect(userAddress);
      
      if (connection.chainId) {
        // Store the chain ID in localStorage for persistence
        localStorage.setItem('linera_chain_id', connection.chainId);
        localStorage.setItem('linera_connected', 'true');
        localStorage.setItem('linera_user_address', userAddress);
        
        // Update the store
        const appId = lineraAdapter.getApplicationId();
        setConnection(connection.chainId, appId);
        
        console.log('✅ Connected to Linera!');
        console.log(`   Chain ID: ${connection.chainId}`);
        console.log(`   App ID: ${appId || '(not set - deploy contract first)'}`);
        
        // Try to connect to the application if App ID is set
        if (appId) {
          try {
            await lineraAdapter.connectApplication(appId);
            console.log('✅ Connected to Dominion application!');
          } catch (appError) {
            console.warn('⚠️ Could not connect to application:', appError);
            // Not fatal - wallet is connected, app connection can happen later
          }
        }
        
        return connection.chainId;
      } else {
        throw new Error('No chain ID received from faucet');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setWalletError(errorMessage);
      console.error('❌ Wallet connection failed:', error);
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [isConnecting, connected, setConnecting, setWalletError, setConnection]);

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      const { lineraAdapter } = await import('@/lib/linera');
      lineraAdapter.disconnect();
    } catch (e) {
      // Ignore import errors during disconnect
    }
    
    localStorage.removeItem('linera_chain_id');
    localStorage.removeItem('linera_connected');
    localStorage.removeItem('linera_user_address');
    disconnect();
  }, [disconnect]);

  // Clear cache and fully reset wallet
  const clearWalletCache = useCallback(async () => {
    try {
      const { lineraAdapter } = await import('@/lib/linera');
      await lineraAdapter.clearCache();
    } catch (e) {
      // Ignore import errors during clear
    }
    
    localStorage.removeItem('linera_chain_id');
    localStorage.removeItem('linera_connected');
    localStorage.removeItem('linera_user_address');
    disconnect();
  }, [disconnect]);

  // Restore connection from localStorage on mount
  const restoreConnection = useCallback(() => {
    const savedChainId = localStorage.getItem('linera_chain_id');
    const wasConnected = localStorage.getItem('linera_connected');
    
    if (savedChainId && wasConnected === 'true') {
      // Note: For full restoration, user would need to reconnect
      // as the WASM client state isn't persisted
      // We can show them as "connected" but they may need to reconnect for mutations
      setConnection(savedChainId, process.env.NEXT_PUBLIC_APP_ID || '');
      return true;
    }
    return false;
  }, [setConnection]);

  // Get shortened chain ID for display
  const shortChainId = chainId 
    ? `${chainId.slice(0, 8)}...${chainId.slice(-6)}`
    : null;

  return {
    connected,
    chainId,
    shortChainId,
    isConnecting,
    walletError,
    adapterLoaded,
    connectWallet,
    disconnectWallet,
    clearWalletCache,
    restoreConnection,
  };
}
