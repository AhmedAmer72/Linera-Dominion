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
  knownPlanets: [],
  
  selectedPanel: null,
  selectedFleetId: null,
  selectedPlanetId: null,
  
  chainId: null,
  appId: null,
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
    
    // Fetch initial state from contract
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
      
      set({
        gameState: 'playing',
        selectedPanel: 'overview',
        playerName: result.name || 'Commander',
        homeX: result.homeX || 100,
        homeY: result.homeY || 100,
        resources: {
          iron: result.iron || 500,
          deuterium: result.deuterium || 200,
          crystals: result.crystals || 50,
        },
      });
    } catch (error) {
      console.error('❌ Failed to fetch game state:', error);
      // Start with default values if fetch fails
      set({
        gameState: 'playing',
        selectedPanel: 'overview',
        playerName: 'Commander',
        homeX: 100,
        homeY: 100,
        resources: {
          iron: 500,
          deuterium: 200,
          crystals: 50,
        },
      });
    }
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
    
    // Check if we can afford
    const resources = get().resources;
    if (resources.iron < totalIron || 
        resources.deuterium < totalDeuterium || 
        resources.crystals < totalCrystals) {
      throw new Error('Not enough resources');
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
      
      // Update resources from contract (resources accumulate over time based on buildings)
      set({
        playerName: result.name || get().playerName,
        homeX: result.homeX || get().homeX,
        homeY: result.homeY || get().homeY,
        resources: {
          iron: result.iron || 0,
          deuterium: result.deuterium || 0,
          crystals: result.crystals || 0,
        },
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
