//! Core type definitions for Linera Dominion
//!
//! These types are shared across all chain types and define the fundamental
//! game objects like players, fleets, buildings, and more.

use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};
use serde::{Deserialize, Serialize};

/// Unique identifier for a player in the game
pub type PlayerId = AccountOwner;

/// Unique identifier for a fleet
pub type FleetId = u64;

/// Unique identifier for a building instance
pub type BuildingId = u64;

/// Unique identifier for a planet
pub type PlanetId = u64;

/// Unique identifier for a battle instance
pub type BattleId = u64;

/// Unique identifier for an alliance
pub type AllianceId = ChainId;

/// A hash used for commit-reveal schemes (Fog of War)
pub type CommitHash = [u8; 32];

/// Salt for cryptographic operations
pub type Salt = [u8; 32];

/// The state of a fleet in the game
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum FleetState {
    /// Fleet is stationed at a location
    Idle,
    /// Fleet is moving to a destination
    Moving {
        destination: super::Coordinate,
        arrival_time: Timestamp,
    },
    /// Fleet is engaged in combat
    InCombat { battle_id: BattleId },
    /// Fleet is docked at a station for repairs
    Docked,
    /// Fleet is blockading a region
    Blockading,
}

impl Default for FleetState {
    fn default() -> Self {
        FleetState::Idle
    }
}

/// Building types available for construction
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum BuildingType {
    /// Produces Iron ore
    MinerDrone = 0,
    /// Produces Deuterium gas
    GasSiphon = 1,
    /// Produces Chronos Crystals (rare resource)
    ChronosCollider = 2,
    /// Increases ship production capacity
    Shipyard = 3,
    /// Extends operational range for fleet movement
    WarpGate = 4,
    /// Defensive structure
    PlanetaryShield = 5,
    /// Research facility for tech tree
    ResearchLab = 6,
    /// Storage for resources
    Warehouse = 7,
    /// Orbital defense platform
    OrbitalCannon = 8,
    /// Communication relay for extended message range
    SubspaceRelay = 9,
}

impl BuildingType {
    /// Get all building types
    pub fn all() -> &'static [BuildingType] {
        &[
            BuildingType::MinerDrone,
            BuildingType::GasSiphon,
            BuildingType::ChronosCollider,
            BuildingType::Shipyard,
            BuildingType::WarpGate,
            BuildingType::PlanetaryShield,
            BuildingType::ResearchLab,
            BuildingType::Warehouse,
            BuildingType::OrbitalCannon,
            BuildingType::SubspaceRelay,
        ]
    }
}

/// Research technologies available in the tech tree
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum Technology {
    /// Increases mining efficiency
    AdvancedMining = 0,
    /// Improves ship armor
    ReinforcedHulls = 1,
    /// Increases weapon damage
    PlasmaWeapons = 2,
    /// Improves ship speed
    IonDrives = 3,
    /// Enables warp travel
    WarpTechnology = 4,
    /// Improves shield capacity
    ShieldHarmonics = 5,
    /// Reduces construction time
    NanoConstruction = 6,
    /// Improves cargo capacity
    ExpandedCargoBays = 7,
    /// Increases sensor range
    LongRangeSensors = 8,
    /// Enables cloaking for scouts
    StealthSystems = 9,
    /// Chronos Crystal research
    TemporalMechanics = 10,
}

/// A building instance on a player's chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Building {
    pub id: BuildingId,
    pub building_type: BuildingType,
    pub level: u32,
    pub coordinate: super::Coordinate,
    /// Timestamp when construction/upgrade completes
    pub construction_end: Option<Timestamp>,
}

/// Research progress for a technology
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResearchProgress {
    /// Map of technology to current level (0 = not researched)
    pub levels: std::collections::BTreeMap<u8, u32>,
    /// Currently researching technology
    pub current_research: Option<(Technology, Timestamp)>,
}

impl ResearchProgress {
    pub fn get_level(&self, tech: Technology) -> u32 {
        self.levels.get(&(tech as u8)).copied().unwrap_or(0)
    }

    pub fn set_level(&mut self, tech: Technology, level: u32) {
        self.levels.insert(tech as u8, level);
    }
}

/// Planet classification affecting resource generation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PlanetType {
    /// Rich in metals (bonus to Iron)
    Metallic,
    /// Gas giant (bonus to Deuterium)
    GasGiant,
    /// Contains Chronos Crystal deposits
    Temporal,
    /// Balanced resources
    Terrestrial,
    /// Barren but easily defensible
    Barren,
    /// Volcanic activity (hazardous but resource-rich)
    Volcanic,
}

/// A planet in the game universe
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Planet {
    pub id: PlanetId,
    pub coordinate: super::Coordinate,
    pub planet_type: PlanetType,
    pub owner: Option<PlayerId>,
    /// Resources staked to maintain control
    pub stake: super::Resources,
    /// Last time stake was updated
    pub stake_timestamp: Timestamp,
    /// Procedurally generated name
    pub name: String,
}

/// Ownership claim with stake decay
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OwnershipStake {
    pub owner: PlayerId,
    pub staked_resources: super::Resources,
    pub last_update: Timestamp,
}

/// Trade offer between players
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeOffer {
    pub id: u64,
    pub sender: PlayerId,
    pub sender_chain: ChainId,
    pub offering: super::Resources,
    pub requesting: super::Resources,
    pub expires_at: Timestamp,
    pub accepted: bool,
}

/// Alliance membership status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum AllianceMemberRole {
    /// Full control over alliance
    Leader,
    /// Can manage members and treasury
    Officer,
    /// Regular member
    Member,
    /// Pending approval
    Applicant,
}

/// Treaty types between alliances
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TreatyType {
    /// No hostility allowed
    NonAggressionPact,
    /// Mutual defense agreement
    DefensiveAlliance,
    /// Full military alliance
    MilitaryAlliance,
    /// Trade agreement with reduced fees
    TradeAgreement,
    /// Shared intelligence
    IntelligenceSharing,
}

/// A treaty between alliances
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Treaty {
    pub id: u64,
    pub treaty_type: TreatyType,
    pub party_a: AllianceId,
    pub party_b: AllianceId,
    pub created_at: Timestamp,
    pub expires_at: Option<Timestamp>,
    pub penalty_crystals: u128,
}
