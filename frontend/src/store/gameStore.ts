import { create } from 'zustand';

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
  
  // Game actions (will integrate with Linera GraphQL)
  buildBuilding: async (type, x, y) => {
    // TODO: Call Linera GraphQL mutation
    console.log('Building:', type, 'at', x, y);
  },
  
  buildShips: async (fleetId, ships) => {
    // TODO: Call Linera GraphQL mutation
    console.log('Building ships for fleet:', fleetId, ships);
  },
  
  sendFleet: async (fleetId, destX, destY, cargo) => {
    // TODO: Call Linera GraphQL mutation
    console.log('Sending fleet:', fleetId, 'to', destX, destY);
  },
  
  startResearch: async (technology) => {
    // TODO: Call Linera GraphQL mutation
    console.log('Starting research:', technology);
  },
}));
