/**
 * Linera Integration Module
 * Re-exports all Linera-related functionality
 */

export { ensureWasmInitialized, isWasmReady, getLinera } from './wasmInit';
export { lineraAdapter, LineraAdapterClass } from './lineraAdapter';
export type { LineraConnection, ApplicationConnection } from './lineraAdapter';
export { LineraProvider, useLinera } from './LineraProvider';
export * from './queries';
