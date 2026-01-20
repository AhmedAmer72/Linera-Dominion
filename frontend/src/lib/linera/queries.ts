/**
 * GraphQL Queries and Mutations for Linera Dominion
 * 
 * These match the contract's GraphQL schema.
 */

// ==================== QUERIES ====================

/**
 * Get the full dominion state
 */
export const GET_DOMINION_STATE = `
  query GetDominionState {
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

/**
 * Get just the resources
 */
export const GET_RESOURCES = `
  query GetResources {
    iron
    deuterium
    crystals
  }
`;

/**
 * Simple hello/health check
 */
export const HELLO_QUERY = `
  query Hello {
    name
  }
`;

// ==================== MUTATIONS ====================

/**
 * Build a structure at coordinates
 */
export const BUILD_STRUCTURE = `
  mutation Build($buildingType: BuildingType!, $x: Int!, $y: Int!) {
    build(buildingType: $buildingType, x: $x, y: $y)
  }
`;

/**
 * Cancel construction of a building
 */
export const CANCEL_CONSTRUCTION = `
  mutation CancelConstruction($buildingId: Int!) {
    cancelConstruction(buildingId: $buildingId)
  }
`;

/**
 * Start research on a technology
 */
export const START_RESEARCH = `
  mutation Research($technology: Technology!) {
    research(technology: $technology)
  }
`;

/**
 * Cancel current research
 */
export const CANCEL_RESEARCH = `
  mutation CancelResearch {
    cancelResearch
  }
`;

/**
 * Build ships of a specific type
 */
export const BUILD_SHIPS = `
  mutation BuildShips($shipType: ShipType!, $quantity: Int!) {
    buildShips(shipType: $shipType, quantity: $quantity)
  }
`;

/**
 * Create a new fleet from ships
 */
export const CREATE_FLEET = `
  mutation CreateFleet($ships: [ShipOrderInput!]!, $name: String) {
    createFleet(ships: $ships, name: $name)
  }
`;

/**
 * Disband a fleet and recover ships
 */
export const DISBAND_FLEET = `
  mutation DisbandFleet($fleetId: Int!) {
    disbandFleet(fleetId: $fleetId)
  }
`;

/**
 * Send a fleet to a destination
 */
export const SEND_FLEET = `
  mutation SendFleet($fleetId: Int!, $destinationX: Int!, $destinationY: Int!, $cargo: ResourceAmountInput) {
    sendFleet(fleetId: $fleetId, destinationX: $destinationX, destinationY: $destinationY, cargo: $cargo)
  }
`;

/**
 * Recall a fleet back to home
 */
export const RECALL_FLEET = `
  mutation RecallFleet($fleetId: Int!) {
    recallFleet(fleetId: $fleetId)
  }
`;

/**
 * Create a trade offer
 */
export const CREATE_TRADE = `
  mutation CreateTrade($targetChain: String!, $offering: ResourceAmountInput!, $requesting: ResourceAmountInput!) {
    createTrade(targetChain: $targetChain, offering: $offering, requesting: $requesting)
  }
`;

/**
 * Accept a trade offer
 */
export const ACCEPT_TRADE = `
  mutation AcceptTrade($offerId: Int!) {
    acceptTrade(offerId: $offerId)
  }
`;

/**
 * Cancel a trade offer
 */
export const CANCEL_TRADE = `
  mutation CancelTrade($offerId: Int!) {
    cancelTrade(offerId: $offerId)
  }
`;

/**
 * Join an alliance
 */
export const JOIN_ALLIANCE = `
  mutation JoinAlliance($allianceChain: String!) {
    joinAlliance(allianceChain: $allianceChain)
  }
`;

/**
 * Leave current alliance
 */
export const LEAVE_ALLIANCE = `
  mutation LeaveAlliance {
    leaveAlliance
  }
`;

// ==================== TYPE DEFINITIONS ====================

/**
 * Building types
 */
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

/**
 * Ship types
 */
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

/**
 * Research technologies
 */
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

/**
 * Resource amounts
 */
export interface ResourceAmount {
  iron: number;
  deuterium: number;
  crystals: number;
}

/**
 * Ship order for fleet creation
 */
export interface ShipOrder {
  shipType: ShipType;
  quantity: number;
}

/**
 * Dominion state response
 */
export interface DominionStateResponse {
  name: string;
  homeX: number;
  homeY: number;
  iron: number;
  deuterium: number;
  crystals: number;
  buildingCount: number;
  fleetCount: number;
}
