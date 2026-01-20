//! Error types for Linera Dominion

use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::types::{FleetId, PlanetId, BattleId, BuildingType, Technology};
use crate::resources::Resources;

/// Errors that can occur in User Chain (Dominion) operations
#[derive(Debug, Clone, Serialize, Deserialize, Error)]
pub enum DominionError {
    #[error("Insufficient resources: need {required:?}, have {available:?}")]
    InsufficientResources {
        required: Resources,
        available: Resources,
    },
    
    #[error("Fleet not found: {0}")]
    FleetNotFound(FleetId),
    
    #[error("Fleet is busy: {0}")]
    FleetBusy(FleetId),
    
    #[error("Invalid fleet state for operation")]
    InvalidFleetState,
    
    #[error("Building not found at specified location")]
    BuildingNotFound,
    
    #[error("Building already under construction")]
    BuildingUnderConstruction,
    
    #[error("Maximum building level reached")]
    MaxBuildingLevel,
    
    #[error("Technology prerequisite not met: requires {prerequisite:?} level {level}")]
    TechPrerequisiteNotMet {
        prerequisite: Technology,
        level: u32,
    },
    
    #[error("Research already in progress")]
    ResearchInProgress,
    
    #[error("Shipyard capacity exceeded")]
    ShipyardCapacityExceeded,
    
    #[error("No shipyard available")]
    NoShipyard,
    
    #[error("Invalid destination")]
    InvalidDestination,
    
    #[error("Insufficient fuel for journey")]
    InsufficientFuel,
    
    #[error("Cargo capacity exceeded")]
    CargoCapacityExceeded,
    
    #[error("Trade offer not found: {0}")]
    TradeOfferNotFound(u64),
    
    #[error("Trade offer expired")]
    TradeOfferExpired,
    
    #[error("Not authorized to perform this action")]
    NotAuthorized,
    
    #[error("Operation not allowed during combat")]
    InCombat,
    
    #[error("Alliance membership required")]
    NotInAlliance,
    
    #[error("Already in an alliance")]
    AlreadyInAlliance,
}

/// Errors that can occur in Region Chain operations
#[derive(Debug, Clone, Serialize, Deserialize, Error)]
pub enum RegionError {
    #[error("Sector is at capacity")]
    SectorFull,
    
    #[error("Fleet not found in this region: {0}")]
    FleetNotFound(FleetId),
    
    #[error("Fleet hash mismatch - possible cheating detected")]
    FleetHashMismatch,
    
    #[error("Fleet already revealed")]
    FleetAlreadyRevealed,
    
    #[error("Planet not found: {0}")]
    PlanetNotFound(PlanetId),
    
    #[error("Planet already claimed")]
    PlanetAlreadyClaimed,
    
    #[error("Not the planet owner")]
    NotPlanetOwner,
    
    #[error("Stake below minimum threshold")]
    StakeBelowMinimum,
    
    #[error("Battle already in progress at this location")]
    BattleInProgress,
    
    #[error("Invalid fleet composition for reveal")]
    InvalidReveal,
    
    #[error("Cross-region transfer denied")]
    TransferDenied,
    
    #[error("Coordinate out of sector bounds")]
    OutOfBounds,
    
    #[error("Entry fee required: {0} energy")]
    EntryFeeRequired(u128),
}

/// Errors that can occur in Battle Chain operations
#[derive(Debug, Clone, Serialize, Deserialize, Error)]
pub enum BattleError {
    #[error("Battle not found: {0}")]
    BattleNotFound(BattleId),
    
    #[error("Battle already resolved")]
    BattleAlreadyResolved,
    
    #[error("Not a combatant in this battle")]
    NotCombatant,
    
    #[error("Not your turn")]
    NotYourTurn,
    
    #[error("Invalid tactical command")]
    InvalidCommand,
    
    #[error("Fleet no longer combat-capable")]
    FleetDestroyed,
    
    #[error("War bond depleted")]
    WarBondDepleted,
    
    #[error("Battle timed out")]
    BattleTimeout,
    
    #[error("Turn already submitted")]
    TurnAlreadySubmitted,
    
    #[error("Cannot retreat on first turn")]
    CannotRetreatYet,
}

/// Errors that can occur in Alliance Chain operations  
#[derive(Debug, Clone, Serialize, Deserialize, Error)]
pub enum AllianceError {
    #[error("Already a member")]
    AlreadyMember,
    
    #[error("Not a member")]
    NotMember,
    
    #[error("Insufficient rank for this action")]
    InsufficientRank,
    
    #[error("Proposal not found: {0}")]
    ProposalNotFound(u64),
    
    #[error("Already voted on this proposal")]
    AlreadyVoted,
    
    #[error("Voting period ended")]
    VotingEnded,
    
    #[error("Treasury insufficient for operation")]
    InsufficientTreasury,
    
    #[error("Treaty with this alliance already exists")]
    TreatyExists,
    
    #[error("Cannot form treaty with self")]
    SelfTreaty,
    
    #[error("Minimum member count not reached")]
    MinimumMembersNotReached,
    
    #[error("Maximum member count exceeded")]
    MaximumMembersExceeded,
}

/// Combined error type for all game errors
#[derive(Debug, Clone, Serialize, Deserialize, Error)]
pub enum GameError {
    #[error("Dominion error: {0}")]
    Dominion(#[from] DominionError),
    
    #[error("Region error: {0}")]
    Region(#[from] RegionError),
    
    #[error("Battle error: {0}")]
    Battle(#[from] BattleError),
    
    #[error("Alliance error: {0}")]
    Alliance(#[from] AllianceError),
    
    #[error("Serialization error: {0}")]
    Serialization(String),
    
    #[error("Invalid message source")]
    InvalidMessageSource,
    
    #[error("Message replay detected")]
    ReplayAttack,
    
    #[error("Timestamp out of valid range")]
    InvalidTimestamp,
}
