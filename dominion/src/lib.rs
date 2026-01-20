//! # Linera Dominion - User Chain Application
//!
//! The Dominion crate implements the User Chain logic for player empire management.

pub mod state;

use async_graphql::{Request, Response, InputObject, SimpleObject, Enum};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{AccountOwner, ChainId, Timestamp},
    views::{linera_views, RootView, ViewStorageContext},
};
use serde::{Deserialize, Serialize};
use thiserror::Error;

// Re-export state types
pub use state::{
    DominionState, WalletData, BuildingData, FleetData, 
    TradeOfferData, ResearchData, AllianceData,
};

// ==================== ENUMS ====================

/// Building types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum BuildingType {
    MinerDrone,
    GasSiphon,
    ChronosCollider,
    Shipyard,
    WarpGate,
    PlanetaryShield,
    ResearchLab,
    Warehouse,
    OrbitalCannon,
    SubspaceRelay,
}

/// Ship types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum ShipType {
    Scout,
    Fighter,
    Cruiser,
    Battleship,
    Carrier,
    Freighter,
    Colonizer,
    MineLay,
    Destroyer,
    Dreadnought,
}

/// Research technologies
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum Technology {
    AdvancedMining,
    ReinforcedHulls,
    PlasmaWeapons,
    IonDrives,
    WarpTechnology,
    ShieldHarmonics,
    NanoConstruction,
    ExpandedCargoBays,
    LongRangeSensors,
    StealthSystems,
    TemporalMechanics,
}

// ==================== INPUT TYPES ====================

/// Resource amounts for operations
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ResourceAmount {
    pub iron: u64,
    pub deuterium: u64,
    pub crystals: u64,
}

/// Coordinate input
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct CoordinateInput {
    pub x: i64,
    pub y: i64,
}

/// Ship build order
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ShipOrder {
    pub ship_type: ShipType,
    pub quantity: u32,
}

// ==================== OPERATIONS ====================

/// Operations that can be performed on a User Chain
#[derive(Debug, Serialize, Deserialize, GraphQLMutationRoot)]
pub enum Operation {
    // ===== Building Operations =====
    /// Construct or upgrade a building
    Build {
        building_type: BuildingType,
        x: i64,
        y: i64,
    },
    
    /// Cancel construction
    CancelConstruction {
        building_id: u64,
    },
    
    // ===== Research Operations =====
    /// Start research
    Research {
        technology: Technology,
    },
    
    /// Cancel research
    CancelResearch,
    
    // ===== Fleet Operations =====
    /// Build ships
    BuildShips {
        ship_type: ShipType,
        quantity: u32,
    },
    
    /// Create a new fleet
    CreateFleet {
        ships: Vec<ShipOrder>,
        name: Option<String>,
    },
    
    /// Disband a fleet
    DisbandFleet {
        fleet_id: u64,
    },
    
    /// Send fleet to destination
    SendFleet {
        fleet_id: u64,
        destination_x: i64,
        destination_y: i64,
        cargo: Option<ResourceAmount>,
    },
    
    /// Recall fleet
    RecallFleet {
        fleet_id: u64,
    },
    
    // ===== Trade Operations =====
    /// Create trade offer
    CreateTrade {
        target_chain: ChainId,
        offering: ResourceAmount,
        requesting: ResourceAmount,
    },
    
    /// Accept trade offer
    AcceptTrade {
        offer_id: u64,
    },
    
    /// Cancel trade offer
    CancelTrade {
        offer_id: u64,
    },
    
    // ===== Alliance Operations =====
    /// Join alliance
    JoinAlliance {
        alliance_chain: ChainId,
    },
    
    /// Leave alliance
    LeaveAlliance,
}

// ==================== MESSAGES ====================

/// Messages between chains
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Trade offer from another player
    TradeOffer {
        offer_id: u64,
        sender: AccountOwner,
        sender_chain: ChainId,
        offering_iron: u64,
        offering_deuterium: u64,
        offering_crystals: u64,
        requesting_iron: u64,
        requesting_deuterium: u64,
        requesting_crystals: u64,
    },
    
    /// Trade accepted
    TradeAccepted {
        offer_id: u64,
    },
    
    /// Trade rejected/cancelled
    TradeCancelled {
        offer_id: u64,
    },
    
    /// Fleet arriving in region
    FleetArrival {
        fleet_id: u64,
        owner: AccountOwner,
        owner_chain: ChainId,
    },
    
    /// Battle result notification
    BattleResult {
        battle_id: u64,
        won: bool,
        surviving_ships: Vec<u32>,
        resources_gained_iron: u64,
        resources_gained_deuterium: u64,
        resources_gained_crystals: u64,
    },
    
    /// Alliance invitation
    AllianceInvite {
        alliance_chain: ChainId,
        alliance_name: String,
    },
}

// ==================== ERRORS ====================

/// Application errors
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum DominionError {
    #[error("Insufficient resources: {0}")]
    InsufficientResources(String),
    
    #[error("Building not found")]
    BuildingNotFound,
    
    #[error("Fleet not found: {0}")]
    FleetNotFound(u64),
    
    #[error("Trade not found: {0}")]
    TradeNotFound(u64),
    
    #[error("Invalid operation: {0}")]
    InvalidOperation(String),
    
    #[error("Not authorized")]
    NotAuthorized,
    
    #[error("Already in alliance")]
    AlreadyInAlliance,
    
    #[error("Not in alliance")]
    NotInAlliance,
    
    #[error("Construction in progress")]
    ConstructionInProgress,
    
    #[error("Research in progress")]
    ResearchInProgress,
}

// ==================== PARAMETERS ====================

/// Application parameters
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct DominionParameters {
    /// Starting iron amount
    pub starting_iron: u64,
    /// Starting deuterium amount  
    pub starting_deuterium: u64,
    /// Starting crystals amount
    pub starting_crystals: u64,
    /// Home coordinate X
    pub home_x: i64,
    /// Home coordinate Y
    pub home_y: i64,
    /// Universe seed
    pub universe_seed: u64,
}

impl Default for DominionParameters {
    fn default() -> Self {
        Self {
            starting_iron: 500,
            starting_deuterium: 200,
            starting_crystals: 50,
            home_x: 0,
            home_y: 0,
            universe_seed: 0,
        }
    }
}

// ==================== ABI ====================

/// Application ABI
pub struct DominionAbi;

impl linera_sdk::abi::ContractAbi for DominionAbi {
    type Operation = Operation;
    type Response = Result<(), DominionError>;
}

impl linera_sdk::abi::ServiceAbi for DominionAbi {
    type Query = Request;
    type QueryResponse = Response;
}
