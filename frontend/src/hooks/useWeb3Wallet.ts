'use client';

import { useCallback, useState } from 'react';
import { BrowserProvider, ethers } from 'ethers';

/**
 * Web3 Wallet Hook
 * 
 * Connects to MetaMask or other Web3 wallets and signs a message
 * to derive a deterministic seed for the Linera private key.
 */

export interface Web3WalletState {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  signature: string | null;
  seed: Uint8Array | null;
}

// The message to sign - this creates a deterministic signature for each wallet
const SIGN_MESSAGE = `Welcome to Linera Dominion!

Sign this message to securely log in to your empire.

This signature will be used to derive your unique Linera identity.
No gas fees. No blockchain transaction.

Domain: Linera Dominion
Chain: Conway Testnet`;

export function useWeb3Wallet() {
  const [state, setState] = useState<Web3WalletState>({
    address: null,
    isConnecting: false,
    error: null,
    signature: null,
    seed: null,
  });

  /**
   * Connect to Web3 wallet (MetaMask, etc.) and sign message to get seed
   */
  const connectAndSign = useCallback(async (): Promise<{ address: string; seed: Uint8Array } | null> => {
    if (state.isConnecting) return null;

    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      // Check if ethereum provider exists
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No Web3 wallet detected. Please install MetaMask!');
      }

      // Create provider and request accounts
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const address = accounts[0] as string;
      console.log('🦊 Connected to Web3 wallet:', address);

      // Check if we have a stored signature for this address
      const storedSig = localStorage.getItem(`linera_sig_${address.toLowerCase()}`);
      const storedSeed = localStorage.getItem(`linera_seed_${address.toLowerCase()}`);
      
      let signature: string;
      let seed: Uint8Array;

      if (storedSig && storedSeed) {
        // Reuse stored signature and seed
        console.log('📝 Found stored signature, reusing...');
        signature = storedSig;
        seed = new Uint8Array(JSON.parse(storedSeed));
      } else {
        // Get signer and sign message
        console.log('✍️ Requesting signature...');
        const signer = await provider.getSigner();
        signature = await signer.signMessage(SIGN_MESSAGE);
        console.log('✅ Message signed!');

        // Hash the signature to create a 32-byte seed for the private key
        // Using keccak256 ensures we get exactly 32 bytes
        const seedHash = ethers.keccak256(ethers.toUtf8Bytes(signature));
        seed = ethers.getBytes(seedHash);

        // Store for future sessions
        localStorage.setItem(`linera_sig_${address.toLowerCase()}`, signature);
        localStorage.setItem(`linera_seed_${address.toLowerCase()}`, JSON.stringify(Array.from(seed)));
        console.log('💾 Signature stored for future sessions');
      }

      setState({
        address,
        isConnecting: false,
        error: null,
        signature,
        seed,
      });

      return { address, seed };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      console.error('❌ Web3 wallet connection failed:', message);
      setState(s => ({ ...s, isConnecting: false, error: message }));
      return null;
    }
  }, [state.isConnecting]);

  /**
   * Check if we have a stored session for any address
   */
  const checkStoredSession = useCallback((): { address: string; seed: Uint8Array } | null => {
    if (typeof window === 'undefined') return null;

    // Look for any stored seeds
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('linera_seed_')) {
        const address = key.replace('linera_seed_', '');
        const storedSeed = localStorage.getItem(key);
        if (storedSeed) {
          try {
            const seed = new Uint8Array(JSON.parse(storedSeed));
            console.log('📂 Found stored session for:', address);
            setState(s => ({ ...s, address, seed }));
            return { address, seed };
          } catch (e) {
            console.warn('Failed to parse stored seed');
          }
        }
      }
    }
    return null;
  }, []);

  /**
   * Disconnect and clear stored session
   */
  const disconnect = useCallback(() => {
    if (state.address) {
      localStorage.removeItem(`linera_sig_${state.address.toLowerCase()}`);
      localStorage.removeItem(`linera_seed_${state.address.toLowerCase()}`);
    }
    setState({
      address: null,
      isConnecting: false,
      error: null,
      signature: null,
      seed: null,
    });
    console.log('🔌 Web3 wallet disconnected');
  }, [state.address]);

  /**
   * Get shortened address for display
   */
  const shortAddress = state.address
    ? `${state.address.slice(0, 6)}...${state.address.slice(-4)}`
    : null;

  return {
    ...state,
    shortAddress,
    connectAndSign,
    checkStoredSession,
    disconnect,
  };
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
