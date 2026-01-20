//! # Linera Dominion - Battle Chain Application
//!
//! The Battle Chain is an ephemeral chain for combat resolution.

pub mod state;
pub mod combat;

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
    BattleState, CombatantData, TurnRecordData, WarBondData,
};

// ==================== ENUMS ====================

/// Tactical command types
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum TacticalCommand {
    AllOutAttack,
    DefensiveStance,
    FocusFire,
    Flank,
    Hold,
    Retreat,
    LaunchFighters,
    FieldRepair,
}

/// Battle termination reasons
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum TerminationReason {
    AttackerVictory,
    DefenderVictory,
    MutualDestruction,
    AttackerRetreat,
    DefenderRetreat,
    Timeout,
    MaxTurnsReached,
}

// ==================== INPUT TYPES ====================

/// Resource input
#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ResourceInput {
    pub iron: u64,
    pub deuterium: u64,
    pub crystals: u64,
}

// ==================== OPERATIONS ====================

/// Operations on Battle Chain
#[derive(Debug, Serialize, Deserialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Submit tactical command for this turn
    SubmitCommand {
        fleet_id: u64,
        command: TacticalCommand,
        target_priority: Option<u8>,
    },
    
    /// Request battle resolution
    RequestResolution,
    
    /// Force resolution due to timeout
    ForceTimeout,
    
    /// Add resources to war bond
    ExtendWarBond {
        additional: ResourceInput,
    },
}

// ==================== MESSAGES ====================

/// Messages for battle chain
#[derive(Debug, Serialize, Deserialize)]
pub enum Message {
    /// Initialize battle with combatants
    InitializeBattle {
        attacker_fleet_id: u64,
        attacker_owner: AccountOwner,
        attacker_chain: ChainId,
        attacker_ships: Vec<u32>,
        defender_fleet_id: u64,
        defender_owner: AccountOwner,
        defender_chain: ChainId,
        defender_ships: Vec<u32>,
    },
    
    /// Submit command via message
    SubmitCommand {
        fleet_id: u64,
        command: u8,
    },
    
    /// Request resolution
    RequestResolution,
    
    /// Force timeout
    ForceTimeout,
    
    /// Battle result to be sent back
    BattleResult {
        battle_id: u64,
        winner: Option<u64>,
        attacker_surviving: Vec<u32>,
        defender_surviving: Vec<u32>,
        debris_iron: u64,
        debris_deuterium: u64,
    },
}

// ==================== ERRORS ====================

/// Battle errors
#[derive(Debug, Error, Serialize, Deserialize)]
pub enum BattleError {
    #[error("Battle not active")]
    BattleNotActive,
    
    #[error("Not a combatant")]
    NotCombatant,
    
    #[error("Already submitted")]
    AlreadySubmitted,
    
    #[error("Fleet not found: {0}")]
    FleetNotFound(u64),
    
    #[error("Invalid command")]
    InvalidCommand,
    
    #[error("Battle already ended")]
    BattleEnded,
    
    #[error("Timeout not reached")]
    TimeoutNotReached,
    
    #[error("Not authorized")]
    NotAuthorized,
}

// ==================== PARAMETERS ====================

/// Battle parameters
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct BattleParameters {
    /// Region chain that spawned this battle
    pub region_chain: ChainId,
    /// Battle position X
    pub position_x: i64,
    /// Battle position Y
    pub position_y: i64,
    /// Maximum turns
    pub max_turns: u32,
    /// Turn timeout in seconds
    pub turn_timeout_secs: u64,
    /// Turn duration in microseconds
    pub turn_duration_micros: u64,
}

/// Battle instantiation argument
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleInstantiationArg {
    pub battle_id: u64,
    pub attacker_fleet_id: u64,
    pub attacker_owner: AccountOwner,
    pub attacker_chain: ChainId,
    pub attacker_ships: Vec<u32>,
    pub defender_fleet_id: u64,
    pub defender_owner: AccountOwner,
    pub defender_chain: ChainId,
    pub defender_ships: Vec<u32>,
}

// ==================== ABI ====================

/// Application ABI
pub struct BattleAbi;

impl linera_sdk::abi::ContractAbi for BattleAbi {
    type Operation = Operation;
    type Response = Result<(), BattleError>;
}

impl linera_sdk::abi::ServiceAbi for BattleAbi {
    type Query = Request;
    type QueryResponse = Response;
}
