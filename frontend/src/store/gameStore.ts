import { create } from 'zustand';
import { lineraAdapter } from '@/lib/linera';
import { saveGameState, loadGameState } from '@/lib/persistence';

// Building type mapping for GraphQL enum
const BUILDING_TYPE_MAP: Record<string, string> = {
  MinerDrone: 'MINER_DRONE',
  GasSiphon: 'GAS_SIPHON',
  ChronosCollider: 'CHRONOS_COLLIDER',
  Shipyard: 'SHIPYARD',
  WarpGate: 'WARP_GATE',
  PlanetaryShield: 'PLANETARY_SHIELD',
  ResearchLab: 'RESEARCH_LAB',
  Warehouse: 'WAREHOUSE',
  OrbitalCannon: 'ORBITAL_CANNON',
  SubspaceRelay: 'SUBSPACE_RELAY',
};

// Ship type mapping for GraphQL enum
const SHIP_TYPE_MAP: Record<string, string> = {
  Scout: 'SCOUT',
  Fighter: 'FIGHTER',
  Cruiser: 'CRUISER',
  Battleship: 'BATTLESHIP',
  Carrier: 'CARRIER',
  Freighter: 'FREIGHTER',
  Colonizer: 'COLONIZER',
  MineLay: 'MINE_LAY',
  Destroyer: 'DESTROYER',
  Dreadnought: 'DREADNOUGHT',
};

// Technology mapping for GraphQL enum
const TECHNOLOGY_MAP: Record<string, string> = {
  AdvancedMining: 'ADVANCED_MINING',
  ReinforcedHulls: 'REINFORCED_HULLS',
  PlasmaWeapons: 'PLASMA_WEAPONS',
  IonDrives: 'ION_DRIVES',
  WarpTechnology: 'WARP_TECHNOLOGY',
  ShieldHarmonics: 'SHIELD_HARMONICS',
  NanoConstruction: 'NANO_CONSTRUCTION',
  ExpandedCargoBays: 'EXPANDED_CARGO_BAYS',
  LongRangeSensors: 'LONG_RANGE_SENSORS',
  StealthSystems: 'STEALTH_SYSTEMS',
  TemporalMechanics: 'TEMPORAL_MECHANICS',
};

export interface Resources {
  iron: number;
  deuterium: number;
  crystals: number;
}

export interface Building {
  id: number;
  type: string;
  level: number;
  x: number;
  y: number;
  constructionEnd?: number;
}

export interface Ship {
  type: string;
  quantity: number;
}

export interface Fleet {
  id: number;
  name: string;
  ships: Ship[];
  status: 'idle' | 'moving' | 'combat' | 'docked';
  x: number;
  y: number;
  destinationX?: number;
  destinationY?: number;
}

export interface InvasionRequirements {
  minShips?: number;              // Minimum total ships required
  requiredShipTypes?: { type: string; count: number }[];  // Specific ship types needed
  minFleetPower?: number;         // Minimum fleet combat power
  requiredTechnology?: string;    // Technology that must be researched
  minBuildingLevel?: { building: string; level: number };  // Building level requirement
}

export interface Planet {
  id: number;
  name: string;
  x: number;
  y: number;
  type: 'rocky' | 'gas' | 'ice' | 'volcanic' | 'oceanic';
  owner?: string;
  resources: Resources;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';  // Planet difficulty
  invasionRequirements?: InvasionRequirements;  // Requirements to invade
  defenseFleet?: { type: string; count: number }[];  // Defending ships
  description?: string;  // Planet lore/description
}

// ===================================
// GALAXY PLANETS - Available for exploration/invasion
// ===================================
const INITIAL_GALAXY_PLANETS: Planet[] = [
  // ===== EASY PLANETS (Nearby, low requirements) =====
  {
    id: 1001,
    name: "Proxima Minor",
    x: 3,
    y: 2,
    type: 'rocky',
    owner: 'neutral',
    resources: { iron: 5000, deuterium: 2000, crystals: 1500 },
    difficulty: 'easy',
    description: "A small rocky world with minimal defenses. Perfect for new commanders.",
    invasionRequirements: {
      minShips: 5,
      requiredShipTypes: [{ type: 'Fighter', count: 3 }],
    },
    defenseFleet: [{ type: 'Fighter', count: 2 }],
  },
  {
    id: 1002,
    name: "Asteroid Haven",
    x: -2,
    y: 4,
    type: 'rocky',
    owner: 'neutral',
    resources: { iron: 8000, deuterium: 1000, crystals: 3000 },
    difficulty: 'easy',
    description: "A resource-rich asteroid field converted into a mining colony.",
    invasionRequirements: {
      minShips: 8,
      requiredShipTypes: [{ type: 'Scout', count: 2 }, { type: 'Fighter', count: 4 }],
    },
    defenseFleet: [{ type: 'Fighter', count: 4 }],
  },
  {
    id: 1003,
    name: "Glacius IV",
    x: 4,
    y: -3,
    type: 'ice',
    owner: 'neutral',
    resources: { iron: 3000, deuterium: 8000, crystals: 2000 },
    difficulty: 'easy',
    description: "Frozen world with abundant deuterium reserves beneath the ice.",
    invasionRequirements: {
      minShips: 6,
      requiredShipTypes: [{ type: 'Fighter', count: 5 }],
    },
    defenseFleet: [{ type: 'Fighter', count: 3 }, { type: 'Scout', count: 2 }],
  },

  // ===== MEDIUM PLANETS (Further out, moderate requirements) =====
  {
    id: 2001,
    name: "Nova Forge",
    x: -6,
    y: -5,
    type: 'volcanic',
    owner: 'hostile',
    resources: { iron: 15000, deuterium: 5000, crystals: 8000 },
    difficulty: 'medium',
    description: "A volcanic world rich in rare metals. Defended by hostile forces.",
    invasionRequirements: {
      minShips: 20,
      requiredShipTypes: [{ type: 'Fighter', count: 10 }, { type: 'Cruiser', count: 2 }],
      requiredTechnology: 'ReinforcedHulls',
    },
    defenseFleet: [{ type: 'Fighter', count: 8 }, { type: 'Cruiser', count: 1 }],
  },
  {
    id: 2002,
    name: "Azure Deep",
    x: 7,
    y: 5,
    type: 'oceanic',
    owner: 'hostile',
    resources: { iron: 10000, deuterium: 12000, crystals: 6000 },
    difficulty: 'medium',
    description: "An ocean world with deep-sea crystal formations.",
    invasionRequirements: {
      minShips: 25,
      requiredShipTypes: [{ type: 'Fighter', count: 12 }, { type: 'Cruiser', count: 3 }],
      minBuildingLevel: { building: 'Shipyard', level: 3 },
    },
    defenseFleet: [{ type: 'Fighter', count: 10 }, { type: 'Cruiser', count: 2 }],
  },
  {
    id: 2003,
    name: "Titan's Rest",
    x: -4,
    y: 8,
    type: 'gas',
    owner: 'hostile',
    resources: { iron: 8000, deuterium: 20000, crystals: 4000 },
    difficulty: 'medium',
    description: "A gas giant with rich deuterium clouds and orbital stations.",
    invasionRequirements: {
      minShips: 22,
      requiredShipTypes: [{ type: 'Fighter', count: 8 }, { type: 'Cruiser', count: 4 }],
      requiredTechnology: 'IonDrives',
    },
    defenseFleet: [{ type: 'Fighter', count: 12 }, { type: 'Cruiser', count: 2 }],
  },

  // ===== HARD PLANETS (Distant, significant requirements) =====
  {
    id: 3001,
    name: "Obsidian Prime",
    x: 10,
    y: -8,
    type: 'volcanic',
    owner: 'hostile',
    resources: { iron: 30000, deuterium: 15000, crystals: 20000 },
    difficulty: 'hard',
    description: "A fortress world guarded by a powerful fleet. Rich beyond measure.",
    invasionRequirements: {
      minShips: 50,
      requiredShipTypes: [{ type: 'Cruiser', count: 8 }, { type: 'Battleship', count: 2 }],
      requiredTechnology: 'PlasmaWeapons',
      minBuildingLevel: { building: 'Shipyard', level: 5 },
    },
    defenseFleet: [{ type: 'Fighter', count: 20 }, { type: 'Cruiser', count: 8 }, { type: 'Battleship', count: 1 }],
  },
  {
    id: 3002,
    name: "Crystal Nebula",
    x: -12,
    y: 6,
    type: 'ice',
    owner: 'hostile',
    resources: { iron: 15000, deuterium: 25000, crystals: 35000 },
    difficulty: 'hard',
    description: "A crystalline world with the largest crystal deposits in the sector.",
    invasionRequirements: {
      minShips: 55,
      requiredShipTypes: [{ type: 'Cruiser', count: 10 }, { type: 'Battleship', count: 3 }],
      requiredTechnology: 'ShieldHarmonics',
      minBuildingLevel: { building: 'ResearchLab', level: 4 },
    },
    defenseFleet: [{ type: 'Fighter', count: 15 }, { type: 'Cruiser', count: 10 }, { type: 'Battleship', count: 2 }],
  },

  // ===== EXTREME PLANETS (End-game, maximum requirements) =====
  {
    id: 4001,
    name: "Dread Citadel",
    x: -15,
    y: -12,
    type: 'rocky',
    owner: 'enemy_empire',
    resources: { iron: 50000, deuterium: 40000, crystals: 45000 },
    difficulty: 'extreme',
    description: "The enemy empire's forward base. Only the strongest can hope to conquer it.",
    invasionRequirements: {
      minShips: 100,
      minFleetPower: 5000,
      requiredShipTypes: [{ type: 'Battleship', count: 5 }, { type: 'Dreadnought', count: 1 }],
      requiredTechnology: 'WarpTechnology',
      minBuildingLevel: { building: 'Shipyard', level: 8 },
    },
    defenseFleet: [{ type: 'Fighter', count: 30 }, { type: 'Cruiser', count: 15 }, { type: 'Battleship', count: 5 }, { type: 'Dreadnought', count: 1 }],
  },
  {
    id: 4002,
    name: "The Nexus",
    x: 18,
    y: 15,
    type: 'gas',
    owner: 'ancient',
    resources: { iron: 60000, deuterium: 80000, crystals: 55000 },
    difficulty: 'extreme',
    description: "An ancient alien station at the heart of the galaxy. Legendary treasures await.",
    invasionRequirements: {
      minShips: 150,
      minFleetPower: 8000,
      requiredShipTypes: [{ type: 'Battleship', count: 8 }, { type: 'Dreadnought', count: 2 }, { type: 'Carrier', count: 1 }],
      requiredTechnology: 'TemporalMechanics',
      minBuildingLevel: { building: 'Shipyard', level: 10 },
    },
    defenseFleet: [{ type: 'Fighter', count: 50 }, { type: 'Cruiser', count: 20 }, { type: 'Battleship', count: 10 }, { type: 'Dreadnought', count: 3 }],
  },
];

export interface Research {
  technology: string;
  level: number;
  inProgress: boolean;
  completionTime?: number;
}

interface GameState {
  // Game status
  gameState: 'loading' | 'menu' | 'playing' | 'battle';
  
  // Player info
  playerName: string;
  homeX: number;
  homeY: number;
  
  // Resources
  resources: Resources;
  resourceRates: Resources;
  
  // Empire data
  buildings: Building[];
  fleets: Fleet[];
  research: Research[];
  
  // Galaxy view
  currentSectorX: number;
  currentSectorY: number;
  knownPlanets: Planet[];
  
  // UI state
  selectedPanel: 'overview' | 'buildings' | 'fleets' | 'research' | 'galaxy' | 'diplomacy' | null;
  selectedFleetId: number | null;
  selectedPlanetId: number | null;
  
  // Linera connection
  chainId: string | null;
  appId: string | null;
  web3Address: string | null;
  connected: boolean;
  isConnecting: boolean;
  walletError: string | null;
  
  // Actions
  initializeGame: () => void;
  loadPersistedState: () => void;
  saveCurrentState: () => void;
  setGameState: (state: 'loading' | 'menu' | 'playing' | 'battle') => void;
  setResources: (resources: Resources) => void;
  addResources: (resources: Partial<Resources>) => void;
  setSelectedPanel: (panel: GameState['selectedPanel']) => void;
  selectFleet: (fleetId: number | null) => void;
  selectPlanet: (planetId: number | null) => void;
  setConnection: (chainId: string, appId: string, web3Address?: string) => void;
  setWeb3Address: (address: string | null) => void;
  setConnecting: (isConnecting: boolean) => void;
  setWalletError: (error: string | null) => void;
  disconnect: () => void;
  
  // Resource management
  tickResources: () => void;  // Called every second to increment resources based on rates
  
  // Game actions
  buildBuilding: (type: string, x: number, y: number) => Promise<void>;
  buildShips: (fleetId: number, ships: Ship[]) => Promise<void>;
  sendFleet: (fleetId: number, destX: number, destY: number, cargo?: Resources) => Promise<void>;
  startResearch: (technology: string) => Promise<void>;
  refreshGameState: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state - empty until wallet connects and fetches from contract
  gameState: 'menu',
  playerName: '',
  homeX: 0,
  homeY: 0,
  
  resources: {
    iron: 0,
    deuterium: 0,
    crystals: 0,
  },
  resourceRates: {
    iron: 0,
    deuterium: 0,
    crystals: 0,
  },
  
  buildings: [],
  
  fleets: [],
  
  research: [],
  
  currentSectorX: 0,
  currentSectorY: 0,
  knownPlanets: INITIAL_GALAXY_PLANETS,
  
  selectedPanel: null,
  selectedFleetId: null,
  selectedPlanetId: null,
  
  chainId: null,
  appId: null,
  web3Address: null,
  connected: false,
  isConnecting: false,
  walletError: null,
  
  // Actions
  initializeGame: async () => {
    const state = get();
    
    // Require wallet connection before playing
    if (!state.connected) {
      console.log('⚠️ Wallet not connected - cannot start game');
      set({ walletError: 'Please connect your wallet first' });
      return;
    }
    
    // First, try to load persisted state from localStorage
    if (state.web3Address) {
      const persisted = loadGameState(state.web3Address);
      if (persisted) {
        console.log('📂 Restored game state from local storage');
        
        // Check if there's an offline bonus
        if (persisted.offlineBonus && (
          persisted.offlineBonus.resources.iron > 0 || 
          persisted.offlineBonus.resources.deuterium > 0 || 
          persisted.offlineBonus.resources.crystals > 0
        )) {
          const bonus = persisted.offlineBonus;
          console.log(`🎁 Offline bonus: +${bonus.resources.iron} Iron, +${bonus.resources.deuterium} Deuterium, +${bonus.resources.crystals} Crystals`);
        }
        
        set({
          gameState: 'playing',
          selectedPanel: 'overview',
          playerName: persisted.playerName,
          homeX: persisted.homeX,
          homeY: persisted.homeY,
          resources: persisted.resources,
          resourceRates: persisted.resourceRates,
          buildings: persisted.buildings,
          fleets: persisted.fleets,
          research: persisted.research,
        });
        
        // Save updated state with new timestamp (after offline accumulation)
        saveGameState(state.web3Address, {
          playerName: persisted.playerName,
          homeX: persisted.homeX,
          homeY: persisted.homeY,
          resources: persisted.resources,
          resourceRates: persisted.resourceRates,
          buildings: persisted.buildings,
          fleets: persisted.fleets,
          research: persisted.research,
        }, state.chainId || undefined);
        
        // Try to sync with blockchain, but DON'T overwrite local resources with 0 values
        try {
          const query = `query { iron deuterium crystals }`;
          const result = await lineraAdapter.query<{ iron: number; deuterium: number; crystals: number }>(query);
          if (result) {
            // Only update if blockchain has MORE resources than local (prevents overwriting with 0)
            const localResources = persisted.resources;
            const blockchainResources = {
              iron: result.iron || 0,
              deuterium: result.deuterium || 0,
              crystals: result.crystals || 0,
            };
            
            // Use the HIGHER of local vs blockchain values
            // This handles the case where blockchain returns 0 but local has accumulated resources
            if (blockchainResources.iron > localResources.iron ||
                blockchainResources.deuterium > localResources.deuterium ||
                blockchainResources.crystals > localResources.crystals) {
              set({
                resources: {
                  iron: Math.max(localResources.iron, blockchainResources.iron),
                  deuterium: Math.max(localResources.deuterium, blockchainResources.deuterium),
                  crystals: Math.max(localResources.crystals, blockchainResources.crystals),
                },
              });
            }
          }
        } catch (e) {
          console.log('⚠️ Could not fetch latest resources from blockchain, using cached values');
        }
        
        return;
      }
    }
    
    // No persisted state - fetch from contract or use defaults
    try {
      console.log('📡 Fetching game state from contract...');
      const query = `
        query {
          name
          homeX
          homeY
          iron
          deuterium
          crystals
          buildingCount
          fleetCount
        }
      `;
      
      const result = await lineraAdapter.query<{
        name: string;
        homeX: number;
        homeY: number;
        iron: number;
        deuterium: number;
        crystals: number;
        buildingCount: number;
        fleetCount: number;
      }>(query);
      
      console.log('✅ Game state fetched:', result);
      
      // Ensure minimum starter resources (never start with 0)
      const MIN_IRON = 500;
      const MIN_DEUTERIUM = 200;
      const MIN_CRYSTALS = 50;
      
      const newState = {
        gameState: 'playing' as const,
        selectedPanel: 'overview' as const,
        playerName: result.name || 'Commander',
        homeX: result.homeX || 100,
        homeY: result.homeY || 100,
        resources: {
          iron: Math.max(result.iron || 0, MIN_IRON),
          deuterium: Math.max(result.deuterium || 0, MIN_DEUTERIUM),
          crystals: Math.max(result.crystals || 0, MIN_CRYSTALS),
        },
      };
      
      set(newState);
      
      // Save initial state
      if (state.web3Address) {
        saveGameState(state.web3Address, {
          playerName: newState.playerName,
          homeX: newState.homeX,
          homeY: newState.homeY,
          resources: newState.resources,
        }, state.chainId || undefined);
      }
    } catch (error) {
      console.error('❌ Failed to fetch game state:', error);
      // Start with default values if fetch fails
      const defaultState = {
        gameState: 'playing' as const,
        selectedPanel: 'overview' as const,
        playerName: 'Commander',
        homeX: 100,
        homeY: 100,
        resources: {
          iron: 500,
          deuterium: 200,
          crystals: 50,
        },
      };
      
      set(defaultState);
      
      // Save default state
      if (state.web3Address) {
        saveGameState(state.web3Address, {
          playerName: defaultState.playerName,
          homeX: defaultState.homeX,
          homeY: defaultState.homeY,
          resources: defaultState.resources,
        }, state.chainId || undefined);
      }
    }
  },
  
  // Load persisted state without starting the game
  loadPersistedState: () => {
    const state = get();
    if (!state.web3Address) return;
    
    const persisted = loadGameState(state.web3Address);
    if (persisted) {
      set({
        playerName: persisted.playerName,
        homeX: persisted.homeX,
        homeY: persisted.homeY,
        resources: persisted.resources,
        resourceRates: persisted.resourceRates,
        buildings: persisted.buildings,
        fleets: persisted.fleets,
        research: persisted.research,
      });
    }
  },
  
  // Save current state to localStorage
  saveCurrentState: () => {
    const state = get();
    if (!state.web3Address) return;
    
    saveGameState(state.web3Address, {
      playerName: state.playerName,
      homeX: state.homeX,
      homeY: state.homeY,
      resources: state.resources,
      resourceRates: state.resourceRates,
      buildings: state.buildings,
      fleets: state.fleets,
      research: state.research,
    }, state.chainId || undefined);
  },
  
  // Tick resources based on production rates (called every second)
  tickResources: () => {
    const state = get();
    const rates = state.resourceRates;
    
    // Only tick if we have production rates
    if (rates.iron > 0 || rates.deuterium > 0 || rates.crystals > 0) {
      // Rates are per hour, so divide by 3600 for per-second increment
      const ironPerSecond = rates.iron / 3600;
      const deuteriumPerSecond = rates.deuterium / 3600;
      const crystalsPerSecond = rates.crystals / 3600;
      
      set((state) => ({
        resources: {
          iron: state.resources.iron + ironPerSecond,
          deuterium: state.resources.deuterium + deuteriumPerSecond,
          crystals: state.resources.crystals + crystalsPerSecond,
        },
      }));
    }
  },
  
  setGameState: (gameState) => set({ gameState }),
  
  setResources: (resources) => {
    set({ resources });
    // Auto-save on resource change
    const state = get();
    if (state.web3Address) {
      saveGameState(state.web3Address, { resources }, state.chainId || undefined);
    }
  },
  
  addResources: (resources) => set((state) => ({
    resources: {
      iron: state.resources.iron + (resources.iron || 0),
      deuterium: state.resources.deuterium + (resources.deuterium || 0),
      crystals: state.resources.crystals + (resources.crystals || 0),
    },
  })),
  
  setSelectedPanel: (selectedPanel) => set({ selectedPanel }),
  
  selectFleet: (selectedFleetId) => set({ selectedFleetId }),
  
  selectPlanet: (selectedPlanetId) => set({ selectedPlanetId }),
  
  setConnection: (chainId, appId, web3Address) => set({ 
    chainId, 
    appId, 
    web3Address: web3Address || null,
    connected: true, 
    isConnecting: false, 
    walletError: null 
  }),
  
  setWeb3Address: (web3Address) => set({ web3Address }),
  
  setConnecting: (isConnecting) => set({ isConnecting }),
  
  setWalletError: (walletError) => set({ walletError, isConnecting: false }),
  
  disconnect: () => set({ chainId: null, appId: null, web3Address: null, connected: false, walletError: null }),
  
  // Game actions (integrated with Linera GraphQL)
  buildBuilding: async (type, x, y) => {
    // Check wallet connection
    if (!get().connected) {
      throw new Error('Wallet not connected');
    }
    
    // Check if lineraAdapter is actually connected (WASM client alive)
    if (!lineraAdapter.isApplicationConnected()) {
      throw new Error('Connection lost. Please reconnect your wallet.');
    }
    
    const buildingType = BUILDING_TYPE_MAP[type] || type.toUpperCase();
    console.log('🏗️ Building:', type, '(', buildingType, ') at', x, y);
    
    // Calculate the cost based on current level
    const existingBuilding = get().buildings.find(b => b.type === type);
    const currentLevel = existingBuilding?.level || 0;
    const costMultiplier = currentLevel + 1;
    
    // Get base costs from building types
    const baseCosts: Record<string, { iron: number; deuterium: number; crystals: number }> = {
      MinerDrone: { iron: 100, deuterium: 50, crystals: 0 },
      GasSiphon: { iron: 150, deuterium: 25, crystals: 10 },
      ChronosCollider: { iron: 500, deuterium: 200, crystals: 50 },
      Shipyard: { iron: 300, deuterium: 100, crystals: 25 },
      WarpGate: { iron: 1000, deuterium: 500, crystals: 100 },
      ResearchLab: { iron: 400, deuterium: 200, crystals: 75 },
      PlanetaryShield: { iron: 600, deuterium: 300, crystals: 150 },
      OrbitalCannon: { iron: 800, deuterium: 400, crystals: 100 },
    };
    
    const cost = baseCosts[type] || { iron: 100, deuterium: 50, crystals: 0 };
    const totalCost = {
      iron: cost.iron * costMultiplier,
      deuterium: cost.deuterium * costMultiplier,
      crystals: cost.crystals * costMultiplier,
    };
    
    // Check if we can afford
    const resources = get().resources;
    if (resources.iron < totalCost.iron || 
        resources.deuterium < totalCost.deuterium || 
        resources.crystals < totalCost.crystals) {
      throw new Error('Not enough resources');
    }
    
    try {
      const mutation = `
        mutation Build($buildingType: BuildingType!, $x: Int!, $y: Int!) {
          build(buildingType: $buildingType, x: $x, y: $y)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        buildingType,
        x,
        y,
      });
      
      console.log('✅ Build request sent successfully');
      
      // Deduct resources optimistically
      set((state) => ({
        resources: {
          iron: state.resources.iron - totalCost.iron,
          deuterium: state.resources.deuterium - totalCost.deuterium,
          crystals: state.resources.crystals - totalCost.crystals,
        },
      }));
      console.log(`💰 Deducted resources: Iron -${totalCost.iron}, Deuterium -${totalCost.deuterium}, Crystals -${totalCost.crystals}`);
      
      // Update building state
      if (existingBuilding) {
        // Upgrade existing building
        set((state) => ({
          buildings: state.buildings.map(b => 
            b.type === type 
              ? { ...b, level: b.level + 1, constructionEnd: Date.now() + 60000 * (b.level + 1) }
              : b
          ),
        }));
        console.log(`✅ Upgraded ${type} to level ${currentLevel + 1}`);
      } else {
        // Add new building
        const newBuilding: Building = {
          id: Date.now(),
          type,
          level: 1,
          x,
          y,
          constructionEnd: Date.now() + 60000, // 60 seconds
        };
        
        set((state) => ({
          buildings: [...state.buildings, newBuilding],
        }));
        console.log(`✅ Built new ${type} at level 1`);
      }
      
      // Update resource rates after building
      const updatedBuildings = get().buildings;
      const minerLevel = updatedBuildings.find(b => b.type === 'MinerDrone')?.level || 0;
      const siphonLevel = updatedBuildings.find(b => b.type === 'GasSiphon')?.level || 0;
      const colliderLevel = updatedBuildings.find(b => b.type === 'ChronosCollider')?.level || 0;
      
      set({
        resourceRates: {
          iron: 50 * minerLevel,
          deuterium: 30 * siphonLevel,
          crystals: 10 * colliderLevel,
        },
      });
      
      // Save state after building
      const state = get();
      if (state.web3Address) {
        saveGameState(state.web3Address, {
          resources: state.resources,
          resourceRates: state.resourceRates,
          buildings: state.buildings,
        }, state.chainId || undefined);
      }
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  },
  
  buildShips: async (fleetId, ships) => {
    // Check wallet connection
    if (!get().connected) {
      throw new Error('Wallet not connected');
    }
    
    // Check if lineraAdapter is actually connected (WASM client alive)
    if (!lineraAdapter.isApplicationConnected()) {
      throw new Error('Connection lost. Please reconnect your wallet.');
    }
    
    console.log('🚀 Building ships for fleet:', fleetId, ships);
    
    // Ship costs
    const shipCosts: Record<string, { iron: number; deuterium: number; crystals: number }> = {
      Scout: { iron: 200, deuterium: 50, crystals: 0 },
      Fighter: { iron: 500, deuterium: 150, crystals: 25 },
      Cruiser: { iron: 1500, deuterium: 500, crystals: 100 },
      Battleship: { iron: 5000, deuterium: 2000, crystals: 500 },
      Carrier: { iron: 8000, deuterium: 4000, crystals: 1000 },
      Freighter: { iron: 1000, deuterium: 500, crystals: 50 },
      Colonizer: { iron: 10000, deuterium: 5000, crystals: 2000 },
      Destroyer: { iron: 3000, deuterium: 1000, crystals: 200 },
      Dreadnought: { iron: 20000, deuterium: 10000, crystals: 5000 },
    };
    
    // Calculate total cost
    let totalIron = 0;
    let totalDeuterium = 0;
    let totalCrystals = 0;
    
    for (const ship of ships) {
      const cost = shipCosts[ship.type] || { iron: 200, deuterium: 50, crystals: 0 };
      totalIron += cost.iron * ship.quantity;
      totalDeuterium += cost.deuterium * ship.quantity;
      totalCrystals += cost.crystals * ship.quantity;
    }
    
    // Check if we can afford (use floor for resources since they tick as floats)
    const resources = get().resources;
    const availableIron = Math.floor(resources.iron);
    const availableDeuterium = Math.floor(resources.deuterium);
    const availableCrystals = Math.floor(resources.crystals);
    
    console.log(`💰 Ship cost: Iron ${totalIron}, Deuterium ${totalDeuterium}, Crystals ${totalCrystals}`);
    console.log(`💰 Available: Iron ${availableIron}, Deuterium ${availableDeuterium}, Crystals ${availableCrystals}`);
    
    if (availableIron < totalIron || 
        availableDeuterium < totalDeuterium || 
        availableCrystals < totalCrystals) {
      console.error(`❌ Not enough resources! Need: Iron ${totalIron}, Deut ${totalDeuterium}, Cryst ${totalCrystals}. Have: Iron ${availableIron}, Deut ${availableDeuterium}, Cryst ${availableCrystals}`);
      throw new Error(`Not enough resources. Need: ${totalIron} Iron, ${totalDeuterium} Deuterium, ${totalCrystals} Crystals. Have: ${availableIron} Iron, ${availableDeuterium} Deuterium, ${availableCrystals} Crystals.`);
    }
    
    try {
      // Build each ship type
      for (const ship of ships) {
        const shipType = SHIP_TYPE_MAP[ship.type] || ship.type.toUpperCase();
        
        const mutation = `
          mutation BuildShips($shipType: ShipType!, $quantity: Int!) {
            buildShips(shipType: $shipType, quantity: $quantity)
          }
        `;
        
        await lineraAdapter.mutate(mutation, {
          shipType,
          quantity: ship.quantity,
        });
      }
      
      console.log('✅ Ship build request sent successfully');
      
      // Deduct resources optimistically
      set((state) => ({
        resources: {
          iron: state.resources.iron - totalIron,
          deuterium: state.resources.deuterium - totalDeuterium,
          crystals: state.resources.crystals - totalCrystals,
        },
      }));
      console.log(`💰 Deducted resources: Iron -${totalIron}, Deuterium -${totalDeuterium}, Crystals -${totalCrystals}`);
      
      // Update frontend state - add ships to fleet or create new fleet
      set((state) => {
        const existingFleet = state.fleets.find(f => f.id === fleetId);
        
        if (existingFleet) {
          // Add ships to existing fleet
          const updatedShips = [...existingFleet.ships];
          for (const newShip of ships) {
            const existing = updatedShips.find(s => s.type === newShip.type);
            if (existing) {
              existing.quantity += newShip.quantity;
            } else {
              updatedShips.push({ type: newShip.type, quantity: newShip.quantity });
            }
          }
          return {
            fleets: state.fleets.map(f => 
              f.id === fleetId ? { ...f, ships: updatedShips } : f
            ),
          };
        } else {
          // Create new fleet with these ships
          const newFleet: Fleet = {
            id: fleetId || Date.now(),
            name: `Fleet ${state.fleets.length + 1}`,
            ships: ships.map(s => ({ type: s.type, quantity: s.quantity })),
            status: 'idle',
            x: state.homeX,
            y: state.homeY,
          };
          return {
            fleets: [...state.fleets, newFleet],
          };
        }
      });
      
      // Save state after building ships
      const state = get();
      if (state.web3Address) {
        saveGameState(state.web3Address, {
          resources: state.resources,
          fleets: state.fleets,
        }, state.chainId || undefined);
      }
    } catch (error) {
      console.error('❌ Ship build failed:', error);
      throw error;
    }
  },
  
  sendFleet: async (fleetId, destX, destY, cargo) => {
    // Check wallet connection
    if (!get().connected) {
      throw new Error('Wallet not connected');
    }
    
    // Check if lineraAdapter is actually connected (WASM client alive)
    if (!lineraAdapter.isApplicationConnected()) {
      throw new Error('Connection lost. Please reconnect your wallet.');
    }
    
    console.log('🛸 Sending fleet:', fleetId, 'to', destX, destY);
    
    try {
      const mutation = `
        mutation SendFleet($fleetId: Int!, $destinationX: Int!, $destinationY: Int!) {
          sendFleet(fleetId: $fleetId, destinationX: $destinationX, destinationY: $destinationY)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        fleetId,
        destinationX: destX,
        destinationY: destY,
      });
      
      console.log('✅ Fleet sent successfully');
      
      // Update fleet status optimistically
      set((state) => ({
        fleets: state.fleets.map((fleet) =>
          fleet.id === fleetId
            ? { ...fleet, status: 'moving' as const, destinationX: destX, destinationY: destY }
            : fleet
        ),
      }));
    } catch (error) {
      console.error('❌ Send fleet failed:', error);
      throw error;
    }
  },
  
  startResearch: async (technology) => {
    // Check wallet connection
    if (!get().connected) {
      throw new Error('Wallet not connected');
    }
    
    // Check if lineraAdapter is actually connected (WASM client alive)
    if (!lineraAdapter.isApplicationConnected()) {
      throw new Error('Connection lost. Please reconnect your wallet.');
    }
    
    const tech = TECHNOLOGY_MAP[technology] || technology.toUpperCase();
    console.log('🔬 Starting research:', technology, '(', tech, ')');
    
    try {
      const mutation = `
        mutation Research($technology: Technology!) {
          research(technology: $technology)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        technology: tech,
      });
      
      console.log('✅ Research started successfully');
      
      // Update research status optimistically
      set((state) => ({
        research: state.research.map((r) =>
          r.technology === technology
            ? { ...r, inProgress: true, completionTime: Date.now() + 300000 }
            : r
        ),
      }));
      
      // Save state after starting research
      const state = get();
      if (state.web3Address) {
        saveGameState(state.web3Address, {
          research: state.research,
        }, state.chainId || undefined);
      }
    } catch (error) {
      console.error('❌ Research failed:', error);
      throw error;
    }
  },
  
  refreshGameState: async () => {
    // Check wallet connection
    if (!get().connected) {
      console.log('⚠️ Cannot refresh - wallet not connected');
      return;
    }
    
    // Check if lineraAdapter is actually connected (WASM client alive)
    if (!lineraAdapter.isApplicationConnected()) {
      console.log('⚠️ Cannot refresh - application not connected');
      return;
    }
    
    console.log('🔄 Refreshing game state from contract...');
    
    try {
      const query = `
        query {
          name
          homeX
          homeY
          iron
          deuterium
          crystals
          buildingCount
          fleetCount
        }
      `;
      
      const result = await lineraAdapter.query<{
        name: string;
        homeX: number;
        homeY: number;
        iron: number;
        deuterium: number;
        crystals: number;
        buildingCount: number;
        fleetCount: number;
      }>(query);
      
      console.log('✅ Game state refreshed:', result);
      
      // Get current local resources (may have accumulated while offline or through ticking)
      const currentResources = get().resources;
      const blockchainResources = {
        iron: result.iron || 0,
        deuterium: result.deuterium || 0,
        crystals: result.crystals || 0,
      };
      
      // Use MAX of local vs blockchain - never lose accumulated resources
      // This prevents blockchain returning 0 from wiping local progress
      const mergedResources = {
        iron: Math.max(currentResources.iron, blockchainResources.iron),
        deuterium: Math.max(currentResources.deuterium, blockchainResources.deuterium),
        crystals: Math.max(currentResources.crystals, blockchainResources.crystals),
      };
      
      console.log(`📊 Resources: Local(${Math.floor(currentResources.iron)}, ${Math.floor(currentResources.deuterium)}, ${Math.floor(currentResources.crystals)}) Blockchain(${blockchainResources.iron}, ${blockchainResources.deuterium}, ${blockchainResources.crystals}) -> Using(${Math.floor(mergedResources.iron)}, ${Math.floor(mergedResources.deuterium)}, ${Math.floor(mergedResources.crystals)})`);
      
      // Update state with merged resources
      set({
        playerName: result.name || get().playerName,
        homeX: result.homeX || get().homeX,
        homeY: result.homeY || get().homeY,
        resources: mergedResources,
      });
      
      // Calculate production rates based on buildings
      const buildings = get().buildings;
      const minerLevel = buildings.find(b => b.type === 'MinerDrone')?.level || 0;
      const siphonLevel = buildings.find(b => b.type === 'GasSiphon')?.level || 0;
      const colliderLevel = buildings.find(b => b.type === 'ChronosCollider')?.level || 0;
      
      set({
        resourceRates: {
          iron: 50 * minerLevel,
          deuterium: 30 * siphonLevel,
          crystals: 10 * colliderLevel,
        },
      });
      
    } catch (error) {
      console.error('❌ Failed to refresh game state:', error);
    }
  },
}));
