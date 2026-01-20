//! Cross-chain message definitions for Linera Dominion
//!
//! Defines all message types for communication between:
//! - User Chains ↔ Region Chains
//! - Region Chains ↔ Battle Chains
//! - User Chains ↔ User Chains (trading)
//! - Alliance Chains ↔ all other chains

use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};
use serde::{Deserialize, Serialize};

use crate::types::{FleetId, BattleId, PlanetId, PlayerId, CommitHash, Salt};
use crate::resources::Resources;
use crate::units::{Fleet, Ship, ShipType};
use crate::coordinates::{Coordinate, SectorCoordinate};

/// Message types for the Dominion (User Chain) application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DominionMessage {
    // ========== Fleet Messages ==========
    
    /// Fleet returning from a region (bounce back or recall)
    FleetReturn {
        fleet: Fleet,
        reason: FleetReturnReason,
    },
    
    /// Fleet successfully arrived at destination (confirmation)
    FleetArrivalConfirmed {
        fleet_id: FleetId,
        position: Coordinate,
    },
    
    /// Battle result notification
    BattleResult {
        battle_id: BattleId,
        outcome: BattleOutcome,
        surviving_fleet: Vec<Ship>,
        experience_gained: u32,
        resources_captured: Resources,
    },

    // ========== Trade Messages ==========
    
    /// Trade offer from another player
    TradeOffer {
        offer_id: u64,
        sender: PlayerId,
        sender_chain: ChainId,
        offering: Resources,
        requesting: Resources,
        expires_at: Timestamp,
    },
    
    /// Trade acceptance confirmation
    TradeAccepted {
        offer_id: u64,
        resources: Resources,
    },
    
    /// Trade rejection or timeout
    TradeRejected {
        offer_id: u64,
        resources: Resources, // Returned locked resources
        reason: TradeRejectReason,
    },

    // ========== Governance Messages ==========
    
    /// Parameter update from Senate Chain
    ParameterUpdate {
        parameter_name: String,
        new_value: Vec<u8>,
        effective_from: Timestamp,
    },
    
    /// Alliance invitation
    AllianceInvitation {
        alliance_id: ChainId,
        alliance_name: String,
        inviter: PlayerId,
    },

    // ========== Resource Messages ==========
    
    /// Resource transfer from another chain
    ResourceTransfer {
        from: PlayerId,
        resources: Resources,
        memo: Option<String>,
    },
    
    /// Stake return from a planet
    StakeReturn {
        planet_id: PlanetId,
        resources: Resources,
    },
}

/// Message types for Region Chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RegionMessage {
    // ========== Fleet Movement ==========
    
    /// Fleet entering this region
    FleetArrival {
        fleet: Fleet,
        /// Commit hash for fog of war (fleet composition hidden)
        fleet_hash: CommitHash,
        target_position: Coordinate,
    },
    
    /// Fleet departing this region
    FleetDeparture {
        fleet_id: FleetId,
        owner: PlayerId,
        destination_sector: SectorCoordinate,
    },
    
    /// Fleet reveal request (for scanning or combat)
    FleetReveal {
        fleet_id: FleetId,
        fleet_data: Fleet,
        salt: Salt,
    },
    
    // ========== Combat ==========
    
    /// Battle chain spawned, lock fleets
    BattleLock {
        battle_id: BattleId,
        battle_chain: ChainId,
        combatants: Vec<FleetId>,
    },
    
    /// Battle resolved, update fleet states
    BattleResolved {
        battle_id: BattleId,
        results: Vec<FleetBattleResult>,
        debris: Resources,
        position: Coordinate,
    },
    
    // ========== Territory ==========
    
    /// Stake resources to claim/maintain planet
    StakePlanet {
        planet_id: PlanetId,
        staker: PlayerId,
        staker_chain: ChainId,
        resources: Resources,
    },
    
    /// Withdraw stake from planet
    UnstakePlanet {
        planet_id: PlanetId,
        owner: PlayerId,
    },
    
    // ========== Cross-Region ==========
    
    /// Fleet transferring from another region
    FleetTransfer {
        fleet: Fleet,
        fleet_hash: CommitHash,
        source_region: SectorCoordinate,
    },
    
    /// Sector congestion notification (triggers cell division)
    CongestionAlert {
        transaction_count: u64,
        timestamp: Timestamp,
    },
}

/// Message types for Battle Chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BattleMessage {
    /// Initialize battle with combatants
    InitializeBattle {
        battle_id: BattleId,
        region_chain: ChainId,
        position: Coordinate,
        attacker: BattleCombatant,
        defender: BattleCombatant,
        war_bond: Resources,
    },
    
    /// Tactical command from a player
    TacticalCommand {
        player: PlayerId,
        fleet_id: FleetId,
        command: TacticalOrder,
    },
    
    /// Submit command (simplified for contract)
    SubmitCommand {
        fleet_id: FleetId,
        command: TacticalOrder,
    },
    
    /// Request battle resolution (timeout or mutual agreement)
    RequestResolution,
    
    /// Force timeout resolution
    ForceTimeout,
    
    /// Battle result to distribute
    BattleResult(BattleResultMessage),
    
    /// Battle chain self-destruct after resolution
    Terminate {
        final_state: BattleFinalState,
    },
}

/// Battle result message for distribution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleResultMessage {
    pub battle_id: BattleId,
    pub outcome: BattleOutcome,
    pub winner: Option<FleetId>,
    pub total_turns: u32,
    pub duration_seconds: u64,
    pub fleet_results: Vec<FleetBattleResult>,
    pub debris_generated: Resources,
}

/// Message types for Alliance Chain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AllianceMessage {
    /// Request to join alliance
    JoinRequest {
        player: PlayerId,
        player_chain: ChainId,
    },
    
    /// Contribution to alliance treasury
    TreasuryDeposit {
        contributor: PlayerId,
        resources: Resources,
    },
    
    /// Vote on a proposal
    Vote {
        proposal_id: u64,
        voter: PlayerId,
        vote: bool,
        voting_power: u128,
    },
    
    /// Treaty proposal
    TreatyProposal {
        treaty_type: crate::types::TreatyType,
        other_alliance: ChainId,
        penalty_crystals: u128,
    },
    
    /// Member violation (auto-slashing)
    ViolationReport {
        violator: PlayerId,
        violation_type: ViolationType,
        evidence_hash: CommitHash,
    },
}

// ========== Supporting Types ==========

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FleetReturnReason {
    SectorFull,
    InvalidDestination,
    Recalled,
    InsufficientFuel,
    AccessDenied,
    Bounced,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BattleOutcome {
    Victory,
    Defeat,
    Retreat,
    Draw,
    Stalemate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TradeRejectReason {
    Rejected,
    Expired,
    InsufficientResources,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FleetBattleResult {
    pub fleet_id: FleetId,
    pub owner: PlayerId,
    pub owner_chain: ChainId,
    pub surviving_ships: Vec<Ship>,
    pub cargo_lost: Resources,
    pub cargo_captured: Resources,
    pub experience_gained: u32,
    pub outcome: BattleOutcome,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleCombatant {
    pub player: PlayerId,
    pub player_chain: ChainId,
    pub fleet: Fleet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TacticalOrder {
    /// Focus fire on specific target
    FocusFire { target_fleet: FleetId },
    /// Defensive formation
    DefensiveStance,
    /// Aggressive assault
    AllOutAttack,
    /// Retreat from battle
    Retreat,
    /// Flank maneuver
    Flank { direction: FlankDirection },
    /// Launch fighter squadrons (carriers only)
    LaunchFighters,
    /// Repair damaged ships (if applicable)
    FieldRepair,
    /// No action this turn
    Hold,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum FlankDirection {
    Left,
    Right,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ResolutionReason {
    Timeout,
    MutualAgreement,
    WarBondDepleted,
    CombatantDestroyed,
    Disconnection,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BattleFinalState {
    pub battle_id: BattleId,
    pub results: Vec<FleetBattleResult>,
    pub duration_seconds: u64,
    pub total_ships_destroyed: u32,
    pub debris_generated: Resources,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ViolationType {
    /// Attacked treaty partner
    TreatyViolation { treaty_id: u64, victim_alliance: ChainId },
    /// Failed to pay alliance dues
    MissedContribution,
    /// Used alliance assets without authorization
    UnauthorizedAssetUse,
    /// Shared intelligence with enemies
    IntelligenceLeak,
}

/// Construction message for ship building notifications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShipConstructionComplete {
    pub ship_type: ShipType,
    pub quantity: u32,
    pub completed_at: Timestamp,
}

// ========== Message Envelope ==========

/// Unified message envelope for cross-chain communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEnvelope {
    /// Unique message ID to prevent replay attacks
    pub msg_id: u64,
    /// Source chain ID
    pub source_chain: ChainId,
    /// Target chain ID
    pub target_chain: ChainId,
    /// Message payload type discriminator
    pub payload_type: MessagePayloadType,
    /// Block timestamp when message was created
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[repr(u8)]
pub enum MessagePayloadType {
    Dominion = 0,
    Region = 1,
    Battle = 2,
    Alliance = 3,
}
