/**
 * Game State Persistence Layer
 * 
 * Handles saving and loading game state from localStorage
 * Keyed by web3Address for per-user persistence
 */

import { Resources, Building, Fleet, Research } from '@/store/gameStore';
import { syncPlayerData } from './leaderboardApi';

export interface PersistedGameState {
  playerName: string;
  homeX: number;
  homeY: number;
  resources: Resources;
  resourceRates: Resources;
  buildings: Building[];
  fleets: Fleet[];
  research: Research[];
  lastSaved: number;
}

const STORAGE_KEY_PREFIX = 'linera_dominion_state_';

/**
 * Get storage key for a specific web3 address
 */
function getStorageKey(web3Address: string): string {
  return `${STORAGE_KEY_PREFIX}${web3Address.toLowerCase()}`;
}

/**
 * Save game state to localStorage and sync to backend
 */
export function saveGameState(web3Address: string, state: Partial<PersistedGameState>): void {
  if (!web3Address || typeof window === 'undefined') return;

  try {
    const key = getStorageKey(web3Address);
    const existing = loadGameState(web3Address);
    
    const toSave: PersistedGameState = {
      playerName: state.playerName ?? existing?.playerName ?? 'Commander',
      homeX: state.homeX ?? existing?.homeX ?? 100,
      homeY: state.homeY ?? existing?.homeY ?? 200,
      resources: state.resources ?? existing?.resources ?? { iron: 500, deuterium: 200, crystals: 50 },
      resourceRates: state.resourceRates ?? existing?.resourceRates ?? { iron: 0, deuterium: 0, crystals: 0 },
      buildings: state.buildings ?? existing?.buildings ?? [],
      fleets: state.fleets ?? existing?.fleets ?? [],
      research: state.research ?? existing?.research ?? [],
      lastSaved: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(toSave));
    console.log('💾 Game state saved for', web3Address.slice(0, 8) + '...');
    
    // Also sync to backend for leaderboard (async, don't wait)
    syncPlayerData(web3Address, {
      address: web3Address,
      playerName: toSave.playerName,
      homeX: toSave.homeX,
      homeY: toSave.homeY,
      resources: toSave.resources,
      buildings: toSave.buildings,
      fleets: toSave.fleets,
      research: toSave.research,
    }).catch(() => {
      // Silently fail - leaderboard sync is optional
    });
  } catch (error) {
    console.error('❌ Failed to save game state:', error);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(web3Address: string): PersistedGameState | null {
  if (!web3Address || typeof window === 'undefined') return null;

  try {
    const key = getStorageKey(web3Address);
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as PersistedGameState;
    console.log('📂 Game state loaded for', web3Address.slice(0, 8) + '...');
    return parsed;
  } catch (error) {
    console.error('❌ Failed to load game state:', error);
    return null;
  }
}

/**
 * Clear game state from localStorage
 */
export function clearGameState(web3Address: string): void {
  if (!web3Address || typeof window === 'undefined') return;

  try {
    const key = getStorageKey(web3Address);
    localStorage.removeItem(key);
    console.log('🗑️ Game state cleared for', web3Address.slice(0, 8) + '...');
  } catch (error) {
    console.error('❌ Failed to clear game state:', error);
  }
}

/**
 * Get all saved player addresses (for leaderboard purposes)
 */
export function getAllSavedPlayers(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const players: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        const address = key.replace(STORAGE_KEY_PREFIX, '');
        players.push(address);
      }
    }
    return players;
  } catch (error) {
    console.error('❌ Failed to get saved players:', error);
    return [];
  }
}
