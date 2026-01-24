/**
 * Leaderboard API Client
 * 
 * Connects to the backend API for leaderboard functionality.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface PlayerData {
  address: string;
  playerName: string;
  homeX: number;
  homeY: number;
  resources: {
    iron: number;
    deuterium: number;
    crystals: number;
  };
  buildings: Array<{
    id: number;
    type: string;
    level: number;
    x: number;
    y: number;
  }>;
  fleets: Array<{
    id: number;
    name: string;
    ships: Array<{ type: string; quantity: number }>;
  }>;
  research: Array<{
    technology: string;
    level: number;
    inProgress: boolean;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  playerName: string;
  buildings: number;
  totalBuildingLevels: number;
  fleets: number;
  totalShips: number;
  resources: {
    iron: number;
    deuterium: number;
    crystals: number;
  };
  score: number;
  lastUpdated: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  totalPlayers: number;
  lastUpdated: string;
}

export interface PlayerRank {
  address: string;
  rank: number;
  totalPlayers: number;
  score: number;
}

/**
 * Sync player data to the leaderboard backend
 */
export async function syncPlayerData(address: string, data: Partial<PlayerData>): Promise<{ success: boolean; score?: number }> {
  try {
    const response = await fetch(`${API_URL}/api/player/${address}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📊 Synced to leaderboard, score:', result.score);
    return { success: true, score: result.score };
  } catch (error) {
    console.warn('⚠️ Could not sync to leaderboard:', error);
    return { success: false };
  }
}

/**
 * Get the leaderboard
 */
export async function getLeaderboard(limit = 100, sortBy = 'score'): Promise<LeaderboardResponse | null> {
  try {
    const response = await fetch(`${API_URL}/api/leaderboard?limit=${limit}&sortBy=${sortBy}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('⚠️ Could not fetch leaderboard:', error);
    return null;
  }
}

/**
 * Get player's rank
 */
export async function getPlayerRank(address: string): Promise<PlayerRank | null> {
  try {
    const response = await fetch(`${API_URL}/api/player/${address}/rank`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Player not on leaderboard yet
      }
      throw new Error(`Failed to fetch rank: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('⚠️ Could not fetch player rank:', error);
    return null;
  }
}

/**
 * Get player data from backend
 */
export async function getPlayerData(address: string): Promise<PlayerData | null> {
  try {
    const response = await fetch(`${API_URL}/api/player/${address}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch player: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('⚠️ Could not fetch player data:', error);
    return null;
  }
}

/**
 * Check if API is available
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ==================== GALAXY/MULTIPLAYER API ====================

export interface GalaxyPlayer {
  address: string;
  playerName: string;
  homeX: number;
  homeY: number;
  score: number;
  powerLevel: number;
  totalShips: number;
  totalBuildingLevels: number;
  fleetCount: number;
  lastUpdated: number;
}

export interface GalaxyPlayersResponse {
  players: GalaxyPlayer[];
  totalPlayers: number;
  timestamp: string;
}

export interface InvasionInfo {
  defender: {
    address: string;
    playerName: string;
    homeX: number;
    homeY: number;
    score: number;
    totalShips: number;
    totalBuildingLevels: number;
    resources: {
      iron: number;
      deuterium: number;
      crystals: number;
    };
    lastUpdated: number;
  };
  invasion: {
    minShipsRequired: number;
    attackerShips: number;
    canInvade: boolean;
    estimatedLootRatio: number;
  };
}

export interface InvasionResult {
  success: boolean;
  victory: boolean;
  battle: {
    attackerShipsLost: number;
    defenderShipsLost: number;
    powerRatio: string;
  };
  loot: {
    iron: number;
    deuterium: number;
    crystals: number;
  } | null;
  message: string;
}

/**
 * Get all players for galaxy map
 */
export async function getGalaxyPlayers(excludeAddress?: string): Promise<GalaxyPlayersResponse | null> {
  try {
    const url = excludeAddress 
      ? `${API_URL}/api/galaxy/players?excludeAddress=${excludeAddress}`
      : `${API_URL}/api/galaxy/players`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch galaxy players: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Could not fetch galaxy players:', error);
    return null;
  }
}

/**
 * Get invasion info for a specific player
 */
export async function getInvasionInfo(defenderAddress: string, attackerAddress: string): Promise<InvasionInfo | null> {
  try {
    const response = await fetch(
      `${API_URL}/api/galaxy/player/${defenderAddress}?attackerAddress=${attackerAddress}`
    );
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch invasion info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('⚠️ Could not fetch invasion info:', error);
    return null;
  }
}

/**
 * Execute an invasion
 */
export async function executeInvasion(
  attackerAddress: string, 
  defenderAddress: string, 
  fleetId?: number
): Promise<InvasionResult | null> {
  try {
    const response = await fetch(`${API_URL}/api/galaxy/invade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        attackerAddress,
        defenderAddress,
        fleetId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Invasion failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('❌ Invasion failed:', error);
    return null;
  }
}
