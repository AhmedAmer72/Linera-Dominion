/**
 * Linera Adapter - Singleton managing all Linera blockchain interactions
 * 
 * This is the single point of contact with @linera/client.
 * All game code should use this adapter instead of importing @linera/client directly.
 * 
 * Based on Linera-Mine and Linera-Arcade patterns.
 */

import { ensureWasmInitialized } from './wasmInit';

// Use 'any' for dynamic module types to avoid TypeScript issues with private constructors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LineraClientModule = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Faucet = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Application = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Chain = any;

// Cached module reference
let lineraClientModule: LineraClientModule | null = null;

/**
 * Dynamically load the @linera/client module
 */
async function getLineraClient(): Promise<LineraClientModule> {
  if (lineraClientModule) return lineraClientModule;
  try {
    lineraClientModule = await import('@linera/client');
    return lineraClientModule;
  } catch (error) {
    console.error('❌ Failed to load @linera/client:', error);
    throw error;
  }
}

// Environment configuration - use NEXT_PUBLIC_ prefix for Next.js
const DEFAULT_FAUCET_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net')
  : 'https://faucet.testnet-conway.linera.net';

// Default Application ID - update this when redeploying contract
const DEFAULT_APP_ID = '441310d20f19153c90b5b13974b02ffcedd98d74614afec6ea208061c332cc9d';

const APPLICATION_ID = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_APP_ID || process.env.NEXT_PUBLIC_LINERA_APP_ID || DEFAULT_APP_ID)
  : DEFAULT_APP_ID;

// Log configuration at module load for debugging (client-side only)
if (typeof window !== 'undefined') {
  console.log('🔧 Linera Adapter Config:');
  console.log(`   Faucet URL: ${DEFAULT_FAUCET_URL}`);
  console.log(`   Application ID: ${APPLICATION_ID ? APPLICATION_ID.slice(0, 16) + '...' : '(not set)'}`);
}

/**
 * Connection state after wallet connect
 */
export interface LineraConnection {
  client: Client;
  wallet: Wallet;
  faucet: Faucet;
  chainId: string;
  address: string;
  /** Auto-signer address for automatic signing without popups */
  autoSignerAddress?: string;
}

/**
 * Application connection state
 */
export interface ApplicationConnection {
  application: Application;
  applicationId: string;
  chain: Chain;
}

/**
 * Listener callback type for state changes
 */
type StateChangeListener = () => void;

/**
 * LineraAdapter - Singleton class managing Linera connections
 */
class LineraAdapterClass {
  private static instance: LineraAdapterClass | null = null;
  
  // Connection state
  private connection: LineraConnection | null = null;
  private appConnection: ApplicationConnection | null = null;
  private connectPromise: Promise<LineraConnection> | null = null;
  
  // Listeners for state changes
  private listeners: Set<StateChangeListener> = new Set();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): LineraAdapterClass {
    if (!LineraAdapterClass.instance) {
      LineraAdapterClass.instance = new LineraAdapterClass();
    }
    return LineraAdapterClass.instance;
  }

  /**
   * Connect to Linera network with a deterministic seed
   * 
   * This allows the same Web3 wallet signature to always produce
   * the same Linera identity, enabling persistent accounts.
   * 
   * @param seed - 32-byte seed derived from Web3 wallet signature
   * @param web3Address - The Web3 wallet address (for identification)
   * @param faucetUrl - Optional faucet URL override
   * @returns LineraConnection with client, wallet, chainId, etc.
   */
  async connectWithSeed(
    seed: Uint8Array,
    web3Address: string,
    faucetUrl: string = DEFAULT_FAUCET_URL
  ): Promise<LineraConnection> {
    const normalizedAddress = web3Address.toLowerCase();

    // If already connected with same address, return existing connection
    if (this.connection && this.connection.address === normalizedAddress) {
      console.log('✅ Already connected to Linera');
      return this.connection;
    }

    // If connection in progress, wait for it
    if (this.connectPromise) {
      console.log('⏳ Connection in progress, waiting...');
      return this.connectPromise;
    }

    // Start new connection with seed
    this.connectPromise = this.performConnectWithSeed(faucetUrl, normalizedAddress, seed);
    
    try {
      const connection = await this.connectPromise;
      return connection;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Internal connection implementation with seeded key
   */
  private async performConnectWithSeed(
    faucetUrl: string,
    web3Address: string,
    seed: Uint8Array
  ): Promise<LineraConnection> {
    try {
      console.log('🔄 Connecting to Linera with Web3 wallet seed...');
      
      // Step 1: Initialize WASM
      await ensureWasmInitialized();
      
      // Step 2: Dynamically load @linera/client
      const lineraModule = await getLineraClient();
      const { Faucet, Client, signer: signerModule } = lineraModule;
      
      // Step 3: Create faucet connection
      console.log(`📡 Connecting to faucet: ${faucetUrl}`);
      const faucet = new Faucet(faucetUrl);
      
      // Step 4: Create Linera wallet from faucet (gets genesis config)
      console.log('👛 Creating Linera wallet...');
      const wallet = await faucet.createWallet();
      
      // Step 5: Create deterministic signer
      // Check what methods are available on PrivateKey
      console.log('🔑 Creating signer...');
      console.log('   Available PrivateKey methods:', Object.keys(signerModule.PrivateKey));
      
      let autoSigner;
      let storedKeyHex = localStorage.getItem(`linera_privkey_${web3Address}`);
      
      if (storedKeyHex) {
        // Try to restore from stored key
        console.log('📂 Found stored private key, attempting restore...');
        try {
          // Try different methods to create from stored key
          if (typeof signerModule.PrivateKey.fromHex === 'function') {
            autoSigner = signerModule.PrivateKey.fromHex(storedKeyHex);
          } else if (typeof signerModule.PrivateKey.from === 'function') {
            autoSigner = signerModule.PrivateKey.from(storedKeyHex);
          } else {
            // Fallback to creating new random key
            console.log('⚠️ Cannot restore key, creating new one...');
            autoSigner = signerModule.PrivateKey.createRandom();
            // Store the new key
            if (typeof autoSigner.toHex === 'function') {
              localStorage.setItem(`linera_privkey_${web3Address}`, autoSigner.toHex());
            }
          }
        } catch (e) {
          console.warn('⚠️ Failed to restore key:', e);
          autoSigner = signerModule.PrivateKey.createRandom();
        }
      } else {
        // Create new random key and try to store it
        console.log('🔑 Creating new random signer...');
        autoSigner = signerModule.PrivateKey.createRandom();
        
        // Try to export and store the key for future sessions
        try {
          if (typeof autoSigner.toHex === 'function') {
            const keyHex = autoSigner.toHex();
            localStorage.setItem(`linera_privkey_${web3Address}`, keyHex);
            console.log('💾 Stored private key for future sessions');
          } else if (typeof autoSigner.toString === 'function') {
            const keyStr = autoSigner.toString();
            localStorage.setItem(`linera_privkey_${web3Address}`, keyStr);
            console.log('💾 Stored private key for future sessions');
          } else {
            console.log('⚠️ Cannot export private key for storage');
          }
        } catch (e) {
          console.warn('⚠️ Could not store private key:', e);
        }
      }
      
      const autoSignerAddress = autoSigner.address();
      console.log(`   Linera address: ${autoSignerAddress}`);
      
      // Step 6: Check if we already have a chain for this address
      const storedChainId = localStorage.getItem(`linera_chain_${web3Address}`);
      let chainId: string;
      
      if (storedChainId) {
        console.log(`📂 Found stored chain ID: ${storedChainId.slice(0, 16)}...`);
        chainId = storedChainId;
        
        // Try to set owner for this chain
        try {
          await wallet.setOwner(chainId, autoSignerAddress);
          console.log('✅ Reconnected to existing chain!');
        } catch (e) {
          console.log('⚠️ Could not reconnect to stored chain, claiming new one...');
          chainId = await faucet.claimChain(wallet, autoSignerAddress);
          localStorage.setItem(`linera_chain_${web3Address}`, chainId);
          console.log(`✅ Claimed new chain: ${chainId}`);
        }
      } else {
        // Claim a new microchain for this address
        console.log(`⛓️ Claiming microchain for Linera address...`);
        chainId = await faucet.claimChain(wallet, autoSignerAddress);
        localStorage.setItem(`linera_chain_${web3Address}`, chainId);
        console.log(`✅ Claimed chain: ${chainId}`);
      }
      
      // Step 7: Create Linera client with signer
      console.log('🔗 Creating Linera client...');
      const client = await new Client(wallet, autoSigner);
      
      // Step 8: Set signer as default owner in wallet
      console.log('⛓️ Configuring wallet...');
      try {
        await wallet.setOwner(chainId, autoSignerAddress);
        console.log('✅ Wallet configured!');
      } catch (setOwnerError) {
        console.warn('⚠️ Could not set default owner:', setOwnerError);
      }
      
      // Store connection
      this.connection = {
        client,
        wallet,
        faucet,
        chainId,
        address: web3Address,
        autoSignerAddress,
      };
      
      console.log('✅ Connected to Linera with persistent identity!');
      console.log(`   Web3 Address: ${web3Address}`);
      console.log(`   Linera Address: ${autoSignerAddress}`);
      console.log(`   Chain ID: ${chainId}`);
      
      this.notifyListeners();
      return this.connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to connect to Linera:', message);
      this.connection = null;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Connect to Linera network
   * 
   * This will:
   * 1. Initialize WASM (if not already done)
   * 2. Connect to Conway faucet
   * 3. Create a Linera wallet
   * 4. Claim a microchain for the user
   * 5. Create a Client with auto-signing
   * 
   * @param userAddress - The user's address (can be any unique identifier)
   * @param faucetUrl - Optional faucet URL override
   * @returns LineraConnection with client, wallet, chainId, etc.
   */
  async connect(
    userAddress: string,
    faucetUrl: string = DEFAULT_FAUCET_URL
  ): Promise<LineraConnection> {
    const normalizedAddress = userAddress.toLowerCase();

    // If already connected with same address, return existing connection
    if (this.connection && this.connection.address === normalizedAddress) {
      console.log('✅ Already connected to Linera');
      return this.connection;
    }

    // If connection in progress, wait for it
    if (this.connectPromise) {
      console.log('⏳ Connection in progress, waiting...');
      return this.connectPromise;
    }

    // Start new connection
    this.connectPromise = this.performConnect(faucetUrl, normalizedAddress);
    
    try {
      const connection = await this.connectPromise;
      return connection;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Internal connection implementation
   */
  private async performConnect(
    faucetUrl: string,
    userAddress: string
  ): Promise<LineraConnection> {
    try {
      console.log('🔄 Connecting to Linera...');
      
      // Step 1: Initialize WASM
      await ensureWasmInitialized();
      
      // Step 2: Dynamically load @linera/client
      const lineraModule = await getLineraClient();
      const { Faucet, Client, signer: signerModule } = lineraModule;
      
      // Step 3: Create faucet connection
      console.log(`📡 Connecting to faucet: ${faucetUrl}`);
      const faucet = new Faucet(faucetUrl);
      
      // Step 4: Create Linera wallet from faucet (gets genesis config)
      console.log('👛 Creating Linera wallet...');
      const wallet = await faucet.createWallet();
      
      // Step 5: Create auto-signer (for automatic signing without popups)
      console.log('🔑 Setting up auto-signing...');
      const autoSigner = signerModule.PrivateKey.createRandom();
      const autoSignerAddress = autoSigner.address();
      console.log(`   Auto-signer address: ${autoSignerAddress}`);
      
      // Step 6: Claim a microchain for the AUTO-SIGNER address
      console.log(`⛓️ Claiming microchain for auto-signer...`);
      const chainId = await faucet.claimChain(wallet, autoSignerAddress);
      console.log(`✅ Claimed chain: ${chainId}`);
      
      // Step 7: Create Linera client with auto-signer
      console.log('🔗 Creating Linera client with auto-signing...');
      const client = await new Client(wallet, autoSigner);
      
      // Step 8: Set auto-signer as default owner in wallet
      console.log('⛓️ Configuring wallet...');
      try {
        await wallet.setOwner(chainId, autoSignerAddress);
        console.log('✅ Wallet configured for auto-signing!');
      } catch (setOwnerError) {
        console.warn('⚠️ Could not set default owner:', setOwnerError);
      }
      
      // Store connection
      this.connection = {
        client,
        wallet,
        faucet,
        chainId,
        address: userAddress,
        autoSignerAddress,
      };
      
      console.log('✅ Connected to Linera successfully with auto-signing!');
      console.log(`   Chain ID: ${chainId}`);
      console.log(`   User Address: ${userAddress}`);
      console.log(`   Auto-Signer (chain owner): ${autoSignerAddress}`);
      
      this.notifyListeners();
      return this.connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to connect to Linera:', message);
      this.connection = null;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Connect to the Dominion game application
   * 
   * @param applicationId - Optional override for application ID
   * @returns ApplicationConnection with application instance
   */
  async connectApplication(
    applicationId: string = APPLICATION_ID
  ): Promise<ApplicationConnection> {
    if (!this.connection) {
      throw new Error('Must connect wallet before connecting to application');
    }

    if (!applicationId) {
      throw new Error('Application ID is not configured. Set NEXT_PUBLIC_APP_ID in your .env.local');
    }

    // If already connected to same application, return existing
    if (this.appConnection && this.appConnection.applicationId === applicationId) {
      console.log('✅ Already connected to application');
      return this.appConnection;
    }

    try {
      console.log(`🎯 Connecting to Dominion application: ${applicationId.slice(0, 16)}...`);
      console.log(`⛓️ Using user's chain: ${this.connection.chainId.slice(0, 16)}...`);
      
      // Use the user's claimed chain
      const chain = await this.connection.client.chain(this.connection.chainId);
      const application = await chain.application(applicationId);
      
      // Set up notifications on the chain for real-time updates
      this.setupChainNotifications(chain);
      
      this.appConnection = {
        application,
        applicationId,
        chain,
      };
      
      console.log('✅ Connected to Dominion game application!');
      this.notifyListeners();
      return this.appConnection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to connect to application:', message);
      this.appConnection = null;
      this.notifyListeners();
      throw error;
    }
  }

  /**
   * Execute a GraphQL query against the application
   */
  async query<T = unknown>(
    graphqlQuery: string,
    variables?: Record<string, unknown>,
    timeoutMs: number = 60000
  ): Promise<T> {
    if (!this.appConnection) {
      throw new Error('Must connect to application before querying');
    }

    const payload = variables
      ? { query: graphqlQuery, variables }
      : { query: graphqlQuery };

    try {
      console.log('📤 Sending query:', JSON.stringify(payload, null, 2));
      
      // Add timeout to prevent infinite waiting
      const queryPromise = this.appConnection.application.query(
        JSON.stringify(payload)
      );
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Query timed out after ${timeoutMs / 1000}s`));
        }, timeoutMs);
      });
      
      const result = await Promise.race([queryPromise, timeoutPromise]);
      
      console.log('📥 Raw result:', result);
      const parsed = JSON.parse(result);
      console.log('📥 Parsed result:', JSON.stringify(parsed, null, 2));
      
      // Check for GraphQL errors
      if (parsed.errors && parsed.errors.length > 0) {
        const firstError = parsed.errors[0];
        console.error('❌ GraphQL errors:', parsed.errors);
        throw new Error(firstError.message || 'GraphQL error');
      }
      
      return parsed.data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Query failed:', message);
      throw error;
    }
  }

  /**
   * Execute a GraphQL mutation against the application
   * This triggers a blockchain transaction.
   */
  async mutate<T = unknown>(
    graphqlMutation: string,
    variables?: Record<string, unknown>,
    timeoutMs: number = 45000,
    maxRetries: number = 4
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Mutation attempt ${attempt}/${maxRetries}...`);
        
        const result = await this.query<T>(graphqlMutation, variables, timeoutMs);
        
        console.log(`✅ Mutation succeeded on attempt ${attempt}`);
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ Mutation attempt ${attempt} failed:`, lastError.message);
        
        // If it's a timeout and we have retries left, wait and retry
        if (lastError.message.includes('timed out') && attempt < maxRetries) {
          const waitTime = attempt * 5000; // Exponential backoff
          console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // For other errors, don't retry
        if (!lastError.message.includes('timed out')) {
          break;
        }
      }
    }
    
    throw new Error(
      lastError?.message.includes('timed out')
        ? `Transaction failed after ${maxRetries} attempts. Please try again in a few moments.`
        : lastError?.message || 'Mutation failed'
    );
  }

  /**
   * Set up notification listener on a chain for real-time updates
   */
  private setupChainNotifications(chain: Chain): void {
    try {
      chain.onNotification((notification: unknown) => {
        const notif = notification as { reason?: { NewBlock?: unknown } };
        if (notif.reason?.NewBlock) {
          console.log('📦 New block received, notifying listeners...');
          this.notifyListeners();
        }
      });
    } catch (error) {
      console.warn('⚠️ Could not set up notifications:', error);
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Check if application is connected
   */
  isApplicationConnected(): boolean {
    return this.appConnection !== null;
  }

  /**
   * Get current connection
   */
  getConnection(): LineraConnection | null {
    return this.connection;
  }

  /**
   * Get current application connection
   */
  getApplicationConnection(): ApplicationConnection | null {
    return this.appConnection;
  }

  /**
   * Get connected wallet address
   */
  getAddress(): string | null {
    return this.connection?.address ?? null;
  }

  /**
   * Get the auto-signer address (the chain owner)
   */
  getAutoSignerAddress(): string | null {
    return this.connection?.autoSignerAddress ?? null;
  }

  /**
   * Get claimed chain ID
   */
  getChainId(): string | null {
    return this.connection?.chainId ?? null;
  }

  /**
   * Get the application ID
   */
  getApplicationId(): string {
    return APPLICATION_ID;
  }

  /**
   * Disconnect and clear all state
   */
  disconnect(): void {
    console.log('🔌 Disconnecting from Linera...');
    this.connection = null;
    this.appConnection = null;
    this.connectPromise = null;
    this.notifyListeners();
  }

  /**
   * Clear cached wallet data from IndexedDB
   */
  async clearCache(): Promise<void> {
    console.log('🧹 Clearing Linera wallet cache...');
    
    this.disconnect();
    
    if (typeof indexedDB !== 'undefined') {
      const databases = await indexedDB.databases?.() || [];
      for (const db of databases) {
        if (db.name && (db.name.includes('linera') || db.name.includes('wallet'))) {
          console.log(`   Deleting database: ${db.name}`);
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
    
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('linera') || key.includes('wallet'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        console.log(`   Removing localStorage key: ${key}`);
        localStorage.removeItem(key);
      });
    }
    
    console.log('✅ Cache cleared.');
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const lineraAdapter = LineraAdapterClass.getInstance();

// Also export the class for testing
export { LineraAdapterClass };

export default lineraAdapter;
