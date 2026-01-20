/**
 * Re-export everything from the linera/ directory for backwards compatibility
 * This file exists because both linera.ts and linera/ directory existed.
 * TypeScript resolves to this file when importing from '@/lib/linera'
 */

// Re-export everything from the linera directory
export * from './linera/index';

// Also keep the legacy Apollo-based types for backwards compatibility
import { lineraClient, buildGraphQLEndpoint, LINERA_CONFIG } from './apollo';
import {
  GET_DOMINION_STATE,
  GET_PLAYER_RESOURCES,
  BUILD_STRUCTURE,
  BUILD_SHIPS,
  CREATE_FLEET,
  SEND_FLEET,
  START_RESEARCH,
} from './queries';

// Types matching the Rust contract definitions
export type BuildingType =
  | 'MinerDrone'
  | 'GasSiphon'
  | 'ChronosCollider'
  | 'Shipyard'
  | 'WarpGate'
  | 'PlanetaryShield'
  | 'ResearchLab'
  | 'Warehouse'
  | 'OrbitalCannon'
  | 'SubspaceRelay';

export type ShipType =
  | 'Scout'
  | 'Fighter'
  | 'Cruiser'
  | 'Battleship'
  | 'Carrier'
  | 'Freighter'
  | 'Colonizer'
  | 'MineLay'
  | 'Destroyer'
  | 'Dreadnought';

export type Technology =
  | 'AdvancedMining'
  | 'ReinforcedHulls'
  | 'PlasmaWeapons'
  | 'IonDrives'
  | 'WarpTechnology'
  | 'ShieldHarmonics'
  | 'NanoConstruction'
  | 'ExpandedCargoBays'
  | 'LongRangeSensors'
  | 'StealthSystems'
  | 'TemporalMechanics';

export interface Resources {
  iron: number;
  deuterium: number;
  crystals: number;
}

export interface ShipOrder {
  shipType: ShipType;
  quantity: number;
}

// Linera API wrapper class
export class LineraAPI {
  private chainId: string;
  private appId: string;
  private endpoint: string;

  constructor(chainId: string, appId: string, baseUrl?: string) {
    this.chainId = chainId;
    this.appId = appId;
    this.endpoint = buildGraphQLEndpoint(
      baseUrl || LINERA_CONFIG.graphqlEndpoint,
      chainId,
      appId
    );
  }

  // Query methods
  async getDominionState() {
    const { data } = await lineraClient.query({
      query: GET_DOMINION_STATE,
      context: { uri: this.endpoint },
    });
    return data;
  }

  async getResources(): Promise<Resources> {
    const { data } = await lineraClient.query({
      query: GET_PLAYER_RESOURCES,
      context: { uri: this.endpoint },
    });
    return {
      iron: data.iron,
      deuterium: data.deuterium,
      crystals: data.crystals,
    };
  }

  // Mutation methods
  async build(buildingType: BuildingType, x: number, y: number) {
    const { data } = await lineraClient.mutate({
      mutation: BUILD_STRUCTURE,
      variables: { buildingType, x, y },
      context: { uri: this.endpoint },
    });
    return data;
  }

  async buildShips(shipType: ShipType, quantity: number) {
    const { data } = await lineraClient.mutate({
      mutation: BUILD_SHIPS,
      variables: { shipType, quantity },
      context: { uri: this.endpoint },
    });
    return data;
  }

  async createFleet(ships: ShipOrder[], name?: string) {
    const { data } = await lineraClient.mutate({
      mutation: CREATE_FLEET,
      variables: { ships, name },
      context: { uri: this.endpoint },
    });
    return data;
  }

  async sendFleet(fleetId: string, destinationX: number, destinationY: number, cargo?: Resources) {
    const { data } = await lineraClient.mutate({
      mutation: SEND_FLEET,
      variables: { fleetId, destinationX, destinationY, cargo },
      context: { uri: this.endpoint },
    });
    return data;
  }

  async startResearch(technology: Technology) {
    const { data } = await lineraClient.mutate({
      mutation: START_RESEARCH,
      variables: { technology },
      context: { uri: this.endpoint },
    });
    return data;
  }
}

// Faucet API for getting initial tokens
export async function requestFromFaucet(chainId?: string): Promise<{ chainId: string; tokens: number }> {
  const response = await fetch(`${LINERA_CONFIG.faucetEndpoint}/api/faucet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chainId }),
  });

  if (!response.ok) {
    throw new Error('Faucet request failed');
  }

  return response.json();
}

// Helper to initialize a new player
export async function initializePlayer(endpoint: string, appId: string) {
  // Request tokens from faucet
  const faucetResult = await requestFromFaucet();
  
  // Create API instance
  const api = new LineraAPI(faucetResult.chainId, appId, endpoint);
  
  return {
    chainId: faucetResult.chainId,
    api,
  };
}
