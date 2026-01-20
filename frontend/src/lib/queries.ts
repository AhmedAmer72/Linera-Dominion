import { gql } from '@apollo/client';

// ===== DOMINION (User Chain) QUERIES =====

export const GET_DOMINION_STATE = gql`
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

export const GET_PLAYER_RESOURCES = gql`
  query GetPlayerResources {
    iron
    deuterium
    crystals
  }
`;

export const GET_PLAYER_BUILDINGS = gql`
  query GetPlayerBuildings {
    buildings {
      id
      buildingType
      level
      x
      y
      constructionEnd
    }
  }
`;

export const GET_PLAYER_FLEETS = gql`
  query GetPlayerFleets {
    fleets {
      id
      name
      ships {
        shipType
        quantity
      }
      status
      x
      y
      destinationX
      destinationY
    }
  }
`;

export const GET_PLAYER_RESEARCH = gql`
  query GetPlayerResearch {
    research {
      technology
      level
      inProgress
      completionTime
    }
  }
`;

// ===== DOMINION MUTATIONS =====

export const BUILD_STRUCTURE = gql`
  mutation Build($buildingType: BuildingType!, $x: Int!, $y: Int!) {
    build(buildingType: $buildingType, x: $x, y: $y)
  }
`;

export const BUILD_SHIPS = gql`
  mutation BuildShips($shipType: ShipType!, $quantity: Int!) {
    buildShips(shipType: $shipType, quantity: $quantity)
  }
`;

export const CREATE_FLEET = gql`
  mutation CreateFleet($ships: [ShipOrderInput!]!, $name: String) {
    createFleet(ships: $ships, name: $name)
  }
`;

export const SEND_FLEET = gql`
  mutation SendFleet($fleetId: ID!, $destinationX: Int!, $destinationY: Int!, $cargo: ResourceAmountInput) {
    sendFleet(fleetId: $fleetId, destinationX: $destinationX, destinationY: $destinationY, cargo: $cargo)
  }
`;

export const RECALL_FLEET = gql`
  mutation RecallFleet($fleetId: ID!) {
    recallFleet(fleetId: $fleetId)
  }
`;

export const START_RESEARCH = gql`
  mutation Research($technology: Technology!) {
    research(technology: $technology)
  }
`;

export const CANCEL_RESEARCH = gql`
  mutation CancelResearch {
    cancelResearch
  }
`;

export const CREATE_TRADE = gql`
  mutation CreateTrade($targetChain: ChainId!, $offering: ResourceAmountInput!, $requesting: ResourceAmountInput!) {
    createTrade(targetChain: $targetChain, offering: $offering, requesting: $requesting)
  }
`;

// ===== REGION CHAIN QUERIES =====

export const GET_SECTOR_INFO = gql`
  query GetSectorInfo {
    sectorX
    sectorY
    planetCount
    activeFleets
  }
`;

export const GET_SECTOR_PLANETS = gql`
  query GetSectorPlanets {
    planets {
      id
      x
      y
      type
      owner
      resources {
        iron
        deuterium
        crystals
      }
    }
  }
`;

export const GET_SECTOR_FLEETS = gql`
  query GetSectorFleets {
    fleets {
      id
      owner
      ownerChain
      x
      y
      status
      shipCount
    }
  }
`;

// ===== REGION MUTATIONS =====

export const CLAIM_PLANET = gql`
  mutation ClaimPlanet($x: Int!, $y: Int!, $fleetId: ID!) {
    claimPlanet(x: $x, y: $y, fleetId: $fleetId)
  }
`;

export const SCAN_FLEET = gql`
  mutation ScanFleet($targetFleetId: ID!) {
    scanFleet(targetFleetId: $targetFleetId)
  }
`;

export const DECLARE_HOSTILITY = gql`
  mutation DeclareHostility($targetChain: ChainId!) {
    declareHostility(targetChain: $targetChain)
  }
`;

// ===== BATTLE CHAIN QUERIES =====

export const GET_BATTLE_STATE = gql`
  query GetBattleState {
    battleId
    phase
    currentTurn
    maxTurns
    attacker
    defender
    winner
  }
`;

export const GET_BATTLE_UNITS = gql`
  query GetBattleUnits {
    attackerUnits {
      shipType
      quantity
      health
    }
    defenderUnits {
      shipType
      quantity
      health
    }
  }
`;

// ===== BATTLE MUTATIONS =====

export const SUBMIT_COMMAND = gql`
  mutation SubmitCommand($commitment: String!) {
    submitCommand(commitment: $commitment)
  }
`;

export const REQUEST_RESOLUTION = gql`
  mutation RequestResolution {
    requestResolution
  }
`;

// ===== SUBSCRIPTION (for real-time updates) =====

export const SUBSCRIBE_TO_STATE = gql`
  subscription OnStateChange {
    stateChanged {
      iron
      deuterium
      crystals
      buildingCount
      fleetCount
    }
  }
`;
