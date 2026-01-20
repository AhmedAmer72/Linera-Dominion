//! Game constants for Linera Dominion
//!
//! These values are the base parameters that can be modified by the Senate Chain.

// ========== Resource Production Rates (per hour) ==========

/// Base Iron production rate at level 1 (per hour)
pub const IRON_BASE_RATE: u64 = 10;
/// Iron production scaling factor (150 = 1.5x per level)
pub const IRON_SCALING_FACTOR: u64 = 150;

/// Base Deuterium production rate at level 1 (per hour)
pub const DEUTERIUM_BASE_RATE: u64 = 5;
/// Deuterium production scaling factor (140 = 1.4x per level)
pub const DEUTERIUM_SCALING_FACTOR: u64 = 140;

/// Base Chronos Crystal production rate at level 1 (per hour, very slow)
pub const CRYSTALS_BASE_RATE: u64 = 1; // Actually 0.1/hr, adjusted with precision
/// Crystal production scaling factor (120 = 1.2x per level)
pub const CRYSTALS_SCALING_FACTOR: u64 = 120;

// ========== Building Costs (Iron / Deuterium) ==========

/// Base cost for Miner Drone
pub const MINER_DRONE_COST_IRON: u128 = 50;
pub const MINER_DRONE_COST_DEUT: u128 = 0;

/// Base cost for Gas Siphon
pub const GAS_SIPHON_COST_IRON: u128 = 100;
pub const GAS_SIPHON_COST_DEUT: u128 = 20;

/// Base cost for Chronos Collider
pub const CHRONOS_COLLIDER_COST_IRON: u128 = 500;
pub const CHRONOS_COLLIDER_COST_DEUT: u128 = 500;

/// Base cost for Shipyard
pub const SHIPYARD_COST_IRON: u128 = 200;
pub const SHIPYARD_COST_DEUT: u128 = 100;

/// Base cost for Warp Gate
pub const WARP_GATE_COST_IRON: u128 = 1000;
pub const WARP_GATE_COST_DEUT: u128 = 1000;

// ========== Capacity and Limits ==========

/// Maximum buildings per player base
pub const MAX_BUILDINGS_PER_BASE: usize = 50;

/// Maximum fleets per player
pub const MAX_FLEETS_PER_PLAYER: usize = 20;

/// Maximum ships per fleet
pub const MAX_SHIPS_PER_FLEET: usize = 1000;

/// Maximum units per Region Chain sector (before auto-sharding)
pub const MAX_UNITS_PER_SECTOR: usize = 5000;

/// Transaction threshold for auto-sharding (TPS)
pub const AUTO_SHARD_TPS_THRESHOLD: u64 = 500;

/// Ships per shipyard level
pub const SHIPS_PER_SHIPYARD_LEVEL: u32 = 2;

/// Sectors of range per Warp Gate level
pub const RANGE_PER_WARP_GATE_LEVEL: u32 = 1;

// ========== Time Constants (in seconds) ==========

/// Base construction time multiplier
pub const CONSTRUCTION_TIME_MULTIPLIER: u64 = 1;

/// Research time multiplier per tech level
pub const RESEARCH_TIME_MULTIPLIER: u64 = 3600; // 1 hour base

/// Fleet movement speed base (distance units per second)
pub const BASE_MOVEMENT_SPEED: u64 = 10;

/// Trade offer default expiration time
pub const TRADE_OFFER_EXPIRATION: u64 = 86400; // 24 hours

/// Battle turn timeout
pub const BATTLE_TURN_TIMEOUT: u64 = 60; // 1 minute

/// Battle maximum duration
pub const BATTLE_MAX_DURATION: u64 = 3600; // 1 hour

/// Offline timeout for forced inbox execution
pub const OFFLINE_TIMEOUT: u64 = 86400; // 24 hours

// ========== Economic Parameters ==========

/// Stake decay rate per hour (percentage)
pub const STAKE_DECAY_RATE_PER_HOUR: u64 = 1; // 1% per hour

/// Minimum stake to claim a planet
pub const MINIMUM_PLANET_STAKE: u128 = 1000;

/// Region entry fee (energy/crystals)
pub const REGION_ENTRY_FEE: u128 = 1;

/// War bond cost to initiate battle
pub const WAR_BOND_COST: u128 = 50;

/// War bond drain per battle block
pub const WAR_BOND_DRAIN_RATE: u128 = 1;

/// Trade fee percentage (0 = no fee)
pub const TRADE_FEE_PERCENTAGE: u64 = 0;

// ========== Combat Parameters ==========

/// Base damage variance (percentage)
pub const DAMAGE_VARIANCE: u32 = 20;

/// Critical hit chance (percentage)
pub const CRITICAL_HIT_CHANCE: u32 = 5;

/// Critical hit multiplier (percentage, 200 = 2x)
pub const CRITICAL_HIT_MULTIPLIER: u32 = 200;

/// Experience gained per combat round
pub const BASE_COMBAT_EXPERIENCE: u32 = 10;

/// Experience for destroying a ship
pub const EXPERIENCE_PER_KILL: u32 = 50;

/// Debris recovery percentage
pub const DEBRIS_RECOVERY_PERCENTAGE: u32 = 30;

// ========== Governance Parameters ==========

/// Voting duration for proposals
pub const VOTING_DURATION: u64 = 604800; // 1 week

/// Quorum percentage for proposals
pub const QUORUM_PERCENTAGE: u64 = 10;

/// Approval threshold percentage
pub const APPROVAL_THRESHOLD: u64 = 51;

/// Alliance minimum members
pub const ALLIANCE_MIN_MEMBERS: usize = 3;

/// Alliance maximum members
pub const ALLIANCE_MAX_MEMBERS: usize = 100;

// ========== Universe Parameters ==========

/// Sector size (coordinate units)
pub const SECTOR_SIZE: i64 = 100;

/// Universe seed for procedural generation
pub const DEFAULT_UNIVERSE_SEED: [u8; 32] = [
    0x4C, 0x49, 0x4E, 0x45, 0x52, 0x41, 0x5F, 0x44, // LINERA_D
    0x4F, 0x4D, 0x49, 0x4E, 0x49, 0x4F, 0x4E, 0x5F, // OMINION_
    0x55, 0x4E, 0x49, 0x56, 0x45, 0x52, 0x53, 0x45, // UNIVERSE
    0x5F, 0x53, 0x45, 0x45, 0x44, 0x5F, 0x56, 0x31, // _SEED_V1
];

/// Maximum entropy value (Doomsday Clock)
pub const MAX_ENTROPY: u128 = 1_000_000_000_000;

/// Entropy per transaction
pub const ENTROPY_PER_TRANSACTION: u128 = 1;

// ========== Initial Player Resources ==========

/// Starting Iron
pub const STARTING_IRON: u128 = 500;

/// Starting Deuterium
pub const STARTING_DEUTERIUM: u128 = 200;

/// Starting Chronos Crystals
pub const STARTING_CRYSTALS: u128 = 0;
