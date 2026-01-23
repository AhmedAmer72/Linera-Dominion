/**
 * Game State Persistence Layer
 * 
 * Handles saving and loading game state from localStorage
 * Keyed by web3Address for per-user persistence
 * Includes offline resource accumulation
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

// Maximum offline time to accumulate (24 hours in seconds)
const MAX_OFFLINE_SECONDS = 24 * 60 * 60;

/**
 * Get storage key for a specific web3 address
 */
function getStorageKey(web3Address: string): string {
  return `${STORAGE_KEY_PREFIX}${web3Address.toLowerCase()}`;
}

/**
 * Calculate resources accumulated while offline
 * Based on resource rates and time elapsed since last save
 */
export function calculateOfflineResources(
  lastSaved: number,
  resourceRates: Resources,
  currentResources: Resources
): { resources: Resources; secondsOffline: number } {
  const now = Date.now();
  const elapsedMs = now - lastSaved;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  // Cap offline time to prevent excessive accumulation
  const cappedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
  
  // Resource rates are per hour, convert to per second
  const ironPerSecond = resourceRates.iron / 3600;
  const deuteriumPerSecond = resourceRates.deuterium / 3600;
  const crystalsPerSecond = resourceRates.crystals / 3600;
  
  // Calculate accumulated resources
  const accumulatedIron = Math.floor(ironPerSecond * cappedSeconds);
  const accumulatedDeuterium = Math.floor(deuteriumPerSecond * cappedSeconds);
  const accumulatedCrystals = Math.floor(crystalsPerSecond * cappedSeconds);
  
  return {
    resources: {
      iron: currentResources.iron + accumulatedIron,
      deuterium: currentResources.deuterium + accumulatedDeuterium,
      crystals: currentResources.crystals + accumulatedCrystals,
    },
    secondsOffline: cappedSeconds,
  };
}

/**
 * Format offline time for display
 */
export function formatOfflineTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
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
 * Load game state from localStorage with offline resource accumulation
 */
export function loadGameState(web3Address: string): (PersistedGameState & { offlineBonus?: { resources: Resources; seconds: number } }) | null {
  if (!web3Address || typeof window === 'undefined') return null;

  try {
    const key = getStorageKey(web3Address);
    const stored = localStorage.getItem(key);
    
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as PersistedGameState;
    console.log('📂 Game state loaded for', web3Address.slice(0, 8) + '...');
    
    // Calculate offline resource accumulation
    if (parsed.lastSaved && parsed.resourceRates) {
      const { resources: newResources, secondsOffline } = calculateOfflineResources(
        parsed.lastSaved,
        parsed.resourceRates,
        parsed.resources
      );
      
      if (secondsOffline > 60) { // Only show if offline for more than 1 minute
        console.log(`⏰ Offline for ${formatOfflineTime(secondsOffline)} - accumulated resources!`);
        
        const offlineBonus = {
          resources: {
            iron: newResources.iron - parsed.resources.iron,
            deuterium: newResources.deuterium - parsed.resources.deuterium,
            crystals: newResources.crystals - parsed.resources.crystals,
          },
          seconds: secondsOffline,
        };
        
        return {
          ...parsed,
          resources: newResources,
          offlineBonus,
        };
      }
    }
    
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
