/**
 * Linera WASM Initialization Module
 * 
 * Ensures @linera/client WASM is initialized exactly once.
 * Based on Linera-Mine and Linera-Arcade patterns.
 */

// Module-level state for singleton pattern
let initPromise: Promise<void> | null = null;
let initialized = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lineraModule: any = null;

/**
 * Dynamically load the @linera/client module
 */
async function getLineraModule() {
  if (lineraModule) return lineraModule;
  try {
    // Dynamic import for client-side only loading
    lineraModule = await import('@linera/client');
    return lineraModule;
  } catch (error) {
    console.error('❌ Failed to load @linera/client module:', error);
    throw error;
  }
}

/**
 * Ensures Linera WASM modules are initialized.
 * Safe to call multiple times - will only initialize once.
 * 
 * @returns Promise that resolves when WASM is ready
 */
export async function ensureWasmInitialized(): Promise<void> {
  // Already initialized - return immediately
  if (initialized) {
    return;
  }

  // Initialization in progress - wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start new initialization
  initPromise = (async () => {
    try {
      console.log('🔄 Initializing Linera WASM modules...');
      const linera = await getLineraModule();
      await linera.initialize();
      initialized = true;
      console.log('✅ Linera WASM modules initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      // Handle "already initialized" error gracefully
      if (
        message.includes('storage is already initialized') || 
        message.includes('already been initialized')
      ) {
        console.warn('⚠️ Linera WASM was already initialized; continuing...');
        initialized = true;
        return;
      }
      
      // Reset state on actual failure so retry is possible
      initPromise = null;
      initialized = false;
      console.error('❌ Failed to initialize Linera WASM:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Check if WASM has been successfully initialized.
 */
export function isWasmReady(): boolean {
  return initialized;
}

/**
 * Reset initialization state (mainly for testing)
 */
export function resetWasmState(): void {
  initPromise = null;
  initialized = false;
}

/**
 * Get the loaded Linera module (for advanced use)
 */
export async function getLinera() {
  if (!initialized) {
    await ensureWasmInitialized();
  }
  return getLineraModule();
}
