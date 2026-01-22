import { create } from 'zustand';
import { lineraAdapter } from '@/lib/linera';

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

export interface Planet {
  id: number;
  name: string;
  x: number;
  y: number;
  type: 'rocky' | 'gas' | 'ice' | 'volcanic' | 'oceanic';
  owner?: string;
  resources: Resources;
}

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
  connected: boolean;
  isConnecting: boolean;
  walletError: string | null;
  
  // Actions
  initializeGame: () => void;
  setGameState: (state: 'loading' | 'menu' | 'playing' | 'battle') => void;
  setResources: (resources: Resources) => void;
  addResources: (resources: Partial<Resources>) => void;
  setSelectedPanel: (panel: GameState['selectedPanel']) => void;
  selectFleet: (fleetId: number | null) => void;
  selectPlanet: (planetId: number | null) => void;
  setConnection: (chainId: string, appId: string) => void;
  setConnecting: (isConnecting: boolean) => void;
  setWalletError: (error: string | null) => void;
  disconnect: () => void;
  
  // Game actions
  buildBuilding: (type: string, x: number, y: number) => Promise<void>;
  buildShips: (fleetId: number, ships: Ship[]) => Promise<void>;
  sendFleet: (fleetId: number, destX: number, destY: number, cargo?: Resources) => Promise<void>;
  startResearch: (technology: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  gameState: 'menu',
  playerName: 'Commander',
  homeX: 100,
  homeY: 200,
  
  resources: {
    iron: 10000,
    deuterium: 5000,
    crystals: 2500,
  },
  resourceRates: {
    iron: 150,
    deuterium: 75,
    crystals: 25,
  },
  
  buildings: [
    { id: 1, type: 'MinerDrone', level: 3, x: 0, y: 0 },
    { id: 2, type: 'GasSiphon', level: 2, x: 1, y: 0 },
    { id: 3, type: 'Shipyard', level: 1, x: 2, y: 0 },
    { id: 4, type: 'ResearchLab', level: 1, x: 0, y: 1 },
  ],
  
  fleets: [
    {
      id: 1,
      name: 'Alpha Squadron',
      ships: [
        { type: 'Scout', quantity: 5 },
        { type: 'Fighter', quantity: 10 },
        { type: 'Cruiser', quantity: 2 },
      ],
      status: 'idle',
      x: 100,
      y: 200,
    },
  ],
  
  research: [
    { technology: 'AdvancedMining', level: 1, inProgress: false },
    { technology: 'ReinforcedHulls', level: 0, inProgress: false },
    { technology: 'PlasmaWeapons', level: 0, inProgress: true, completionTime: Date.now() + 300000 },
  ],
  
  currentSectorX: 0,
  currentSectorY: 0,
  knownPlanets: [
    { id: 1, name: 'Home World', x: 100, y: 200, type: 'rocky', owner: 'player', resources: { iron: 5000, deuterium: 2000, crystals: 500 } },
    { id: 2, name: 'Alpha Prime', x: 105, y: 195, type: 'gas', resources: { iron: 0, deuterium: 10000, crystals: 0 } },
    { id: 3, name: 'Crystal Moon', x: 98, y: 210, type: 'ice', resources: { iron: 1000, deuterium: 500, crystals: 5000 } },
  ],
  
  selectedPanel: null,
  selectedFleetId: null,
  selectedPlanetId: null,
  
  chainId: null,
  appId: null,
  connected: false,
  isConnecting: false,
  walletError: null,
  
  // Actions
  initializeGame: () => {
    set({ gameState: 'playing', selectedPanel: 'overview' });
  },
  
  setGameState: (gameState) => set({ gameState }),
  
  setResources: (resources) => set({ resources }),
  
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
  
  setConnection: (chainId, appId) => set({ chainId, appId, connected: true, isConnecting: false, walletError: null }),
  
  setConnecting: (isConnecting) => set({ isConnecting }),
  
  setWalletError: (walletError) => set({ walletError, isConnecting: false }),
  
  disconnect: () => set({ chainId: null, appId: null, connected: false, walletError: null }),
  
  // Game actions (integrated with Linera GraphQL)
  buildBuilding: async (type, x, y) => {
    const buildingType = BUILDING_TYPE_MAP[type] || type.toUpperCase();
    console.log('🏗️ Building:', type, '(', buildingType, ') at', x, y);
    
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
      
      // Optimistically add building to UI
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
    } catch (error) {
      console.error('❌ Build failed:', error);
      throw error;
    }
  },
  
  buildShips: async (fleetId, ships) => {
    console.log('🚀 Building ships for fleet:', fleetId, ships);
    
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
    } catch (error) {
      console.error('❌ Ship build failed:', error);
      throw error;
    }
  },
  
  sendFleet: async (fleetId, destX, destY, cargo) => {
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
    } catch (error) {
      console.error('❌ Research failed:', error);
      throw error;
    }
  },
}));
