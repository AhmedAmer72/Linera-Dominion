//! # Linera Dominion - Region Chain Application
//!
//! The Region Chain manages a spatial sector of the game universe.

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
    RegionState, FleetPresenceData, PlanetData, DebrisData, BattleRef,
};

// ==================== ENUMS ====================

/// Planet type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum PlanetType {
    Metallic,
    GasGiant,
    Temporal,
    Terrestrial,
    Barren,
    Volcanic,
}

// ==================== INPUT TYPES ====================

/// Coordinate input
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct CoordinateInput {
    pub x: i64,
    pub y: i64,
}

/// Resource stake input
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct StakeInput {
    pub iron: u64,
    pub deuterium: u64,
    pub crystals: u64,
}

// ==================== OPERATIONS ====================

/// Operations on Region Chain
#[derive(Debug, Serialize, Deserialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Claim a planet with stake
    ClaimPlanet {
        planet_id: u64,
        stake: StakeInput,
    },
    
    /// Resupply planet stake
    ResupplyPlanet {
        planet_id: u64,
        additional_stake: StakeInput,
    },
    
    /// Abandon a planet
    AbandonPlanet {
        planet_id: u64,
    },
    
    /// Scan a fleet (force reveal)
    ScanFleet {
        target_fleet_id: u64,
        scanner_fleet_id: u64,
    },
    
    /// Declare hostility (trigger combat)
    DeclareHostility {
        attacker_fleet_id: u64,
        target_fleet_id: u64,
    },
    
    /// Collect debris
    CollectDebris {
        fleet_id: u64,
        debris_id: u64,
    },
    
    /// Process stake decay
    ProcessStakeDecay,
}

// ==================== MESSAGES ====================

/// Messages between chains
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Fleet entering sector
    FleetEnter {
        fleet_id: u64,
        owner: AccountOwner,
        owner_chain: ChainId,
        x: i64,
        y: i64,
        commitment_hash: String,
    },
    
    /// Fleet leaving sector
    FleetLeave {
        fleet_id: u64,
    },
    
    /// Fleet reveal (fog of war)
    FleetReveal {
        fleet_id: u64,
        ship_counts: Vec<u32>,
        salt: String,
    },
    
    /// Battle initiated
    BattleInitiated {
        battle_id: u64,
        battle_chain: ChainId,
        attacker_fleet_id: u64,
        defender_fleet_id: u64,
    },
    
    /// Battle resolved
    BattleResolved {
        battle_id: u64,
        winner_fleet_id: Option<u64>,
        debris_iron: u64,
        debris_deuterium: u64,
    },
    
    /// Planet claim notification
    PlanetClaimed {
        planet_id: u64,
        owner: AccountOwner,
        owner_chain: ChainId,
    },
}

// ==================== ERRORS ====================

/// Region errors
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum RegionError {
    #[error("Planet not found: {0}")]
    PlanetNotFound(u64),
    
    #[error("Planet already claimed")]
    PlanetAlreadyClaimed,
    
    #[error("Fleet not found: {0}")]
    FleetNotFound(u64),
    
    #[error("Fleet not in sector")]
    FleetNotInSector,
    
    #[error("Invalid reveal")]
    InvalidReveal,
    
    #[error("Not authorized")]
    NotAuthorized,
    
    #[error("Insufficient stake")]
    InsufficientStake,
    
    #[error("Sector is subdivided")]
    SectorSubdivided,
    
    #[error("Battle already in progress")]
    BattleInProgress,
}

// ==================== PARAMETERS ====================

/// Region parameters
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct RegionParameters {
    /// Sector X coordinate
    pub sector_x: i64,
    /// Sector Y coordinate
    pub sector_y: i64,
    /// Universe seed
    pub universe_seed: u64,
    /// Sector size
    pub sector_size: u64,
}

impl Default for RegionParameters {
    fn default() -> Self {
        Self {
            sector_x: 0,
            sector_y: 0,
            universe_seed: 0,
            sector_size: 1000,
        }
    }
}

// ==================== ABI ====================

/// Application ABI
pub struct RegionAbi;

impl linera_sdk::abi::ContractAbi for RegionAbi {
    type Operation = Operation;
    type Response = Result<(), RegionError>;
}

impl linera_sdk::abi::ServiceAbi for RegionAbi {
    type Query = Request;
    type QueryResponse = Response;
}
