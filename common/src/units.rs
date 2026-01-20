//! Unit and fleet definitions for Linera Dominion
//!
//! Defines all ship types, their stats, and fleet composition rules.

use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};
use serde::{Deserialize, Serialize};

use crate::types::{FleetId, FleetState, CommitHash, Salt};
use crate::resources::Resources;
use crate::coordinates::Coordinate;

/// Ship class defining base stats
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum ShipType {
    /// Fast, cheap scout for exploration
    Scout = 0,
    /// Basic combat unit
    Fighter = 1,
    /// Heavy combat ship
    Cruiser = 2,
    /// Capital ship with heavy weapons
    Battleship = 3,
    /// Massive carrier for fighters
    Carrier = 4,
    /// Transport for resources
    Freighter = 5,
    /// Colony ship for claiming planets
    Colonizer = 6,
    /// Defensive mine layer
    MineLay = 7,
    /// Anti-fighter escort
    Destroyer = 8,
    /// Ultimate weapon (alliance only)
    Dreadnought = 9,
}

impl ShipType {
    /// Get all ship types
    pub fn all() -> &'static [ShipType] {
        &[
            ShipType::Scout,
            ShipType::Fighter,
            ShipType::Cruiser,
            ShipType::Battleship,
            ShipType::Carrier,
            ShipType::Freighter,
            ShipType::Colonizer,
            ShipType::MineLay,
            ShipType::Destroyer,
            ShipType::Dreadnought,
        ]
    }

    /// Get base stats for this ship type
    pub fn base_stats(&self) -> ShipStats {
        match self {
            ShipType::Scout => ShipStats {
                max_health: 50,
                attack: 5,
                defense: 2,
                speed: 200,
                cargo_capacity: 10,
                fuel_consumption: 1,
            },
            ShipType::Fighter => ShipStats {
                max_health: 100,
                attack: 25,
                defense: 10,
                speed: 150,
                cargo_capacity: 0,
                fuel_consumption: 2,
            },
            ShipType::Cruiser => ShipStats {
                max_health: 300,
                attack: 80,
                defense: 40,
                speed: 100,
                cargo_capacity: 50,
                fuel_consumption: 5,
            },
            ShipType::Battleship => ShipStats {
                max_health: 800,
                attack: 200,
                defense: 100,
                speed: 60,
                cargo_capacity: 100,
                fuel_consumption: 15,
            },
            ShipType::Carrier => ShipStats {
                max_health: 600,
                attack: 50,
                defense: 150,
                speed: 50,
                cargo_capacity: 500,
                fuel_consumption: 20,
            },
            ShipType::Freighter => ShipStats {
                max_health: 150,
                attack: 5,
                defense: 20,
                speed: 80,
                cargo_capacity: 1000,
                fuel_consumption: 8,
            },
            ShipType::Colonizer => ShipStats {
                max_health: 200,
                attack: 0,
                defense: 30,
                speed: 40,
                cargo_capacity: 200,
                fuel_consumption: 25,
            },
            ShipType::MineLay => ShipStats {
                max_health: 100,
                attack: 0,
                defense: 15,
                speed: 100,
                cargo_capacity: 100,
                fuel_consumption: 3,
            },
            ShipType::Destroyer => ShipStats {
                max_health: 200,
                attack: 60,
                defense: 30,
                speed: 120,
                cargo_capacity: 20,
                fuel_consumption: 4,
            },
            ShipType::Dreadnought => ShipStats {
                max_health: 5000,
                attack: 1000,
                defense: 500,
                speed: 20,
                cargo_capacity: 1000,
                fuel_consumption: 100,
            },
        }
    }

    /// Get construction cost
    pub fn construction_cost(&self) -> Resources {
        match self {
            ShipType::Scout => Resources::new(100, 50, 0),
            ShipType::Fighter => Resources::new(500, 200, 0),
            ShipType::Cruiser => Resources::new(2000, 1000, 10),
            ShipType::Battleship => Resources::new(8000, 4000, 50),
            ShipType::Carrier => Resources::new(10000, 5000, 100),
            ShipType::Freighter => Resources::new(1000, 500, 0),
            ShipType::Colonizer => Resources::new(5000, 3000, 200),
            ShipType::MineLay => Resources::new(800, 400, 5),
            ShipType::Destroyer => Resources::new(1500, 750, 20),
            ShipType::Dreadnought => Resources::new(100000, 50000, 5000),
        }
    }

    /// Get construction time in seconds
    pub fn construction_time(&self) -> u64 {
        match self {
            ShipType::Scout => 60,
            ShipType::Fighter => 300,
            ShipType::Cruiser => 900,
            ShipType::Battleship => 3600,
            ShipType::Carrier => 5400,
            ShipType::Freighter => 600,
            ShipType::Colonizer => 7200,
            ShipType::MineLay => 400,
            ShipType::Destroyer => 500,
            ShipType::Dreadnought => 86400, // 24 hours
        }
    }
}

/// Base stats for a ship type
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct ShipStats {
    pub max_health: u32,
    pub attack: u32,
    pub defense: u32,
    /// Speed affects travel time between sectors
    pub speed: u32,
    /// Cargo capacity for transporting resources
    pub cargo_capacity: u32,
    /// Deuterium consumed per sector traveled
    pub fuel_consumption: u32,
}

/// An individual ship instance
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ship {
    pub ship_type: ShipType,
    pub health: u32,
    /// Experience from combat (affects damage bonus)
    pub experience: u32,
}

impl Ship {
    pub fn new(ship_type: ShipType) -> Self {
        Self {
            ship_type,
            health: ship_type.base_stats().max_health,
            experience: 0,
        }
    }

    pub fn is_alive(&self) -> bool {
        self.health > 0
    }

    /// Calculate effective attack with experience bonus
    pub fn effective_attack(&self) -> u32 {
        let base = self.ship_type.base_stats().attack;
        let exp_bonus = self.experience / 100; // 1% bonus per 100 XP
        base + (base * exp_bonus / 100)
    }

    /// Calculate effective defense with experience bonus
    pub fn effective_defense(&self) -> u32 {
        let base = self.ship_type.base_stats().defense;
        let exp_bonus = self.experience / 200; // 0.5% bonus per 100 XP
        base + (base * exp_bonus / 100)
    }
}

/// A fleet is a collection of ships with cargo
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fleet {
    pub id: FleetId,
    pub owner: AccountOwner,
    pub owner_chain: ChainId,
    pub ships: Vec<Ship>,
    pub cargo: Resources,
    pub position: Coordinate,
    pub state: FleetState,
    pub last_update: Timestamp,
}

impl Fleet {
    pub fn new(
        id: FleetId,
        owner: AccountOwner,
        owner_chain: ChainId,
        ships: Vec<Ship>,
        position: Coordinate,
        timestamp: Timestamp,
    ) -> Self {
        Self {
            id,
            owner,
            owner_chain,
            ships,
            cargo: Resources::zero(),
            position,
            state: FleetState::Idle,
            last_update: timestamp,
        }
    }

    /// Calculate total fleet power
    pub fn total_attack(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.effective_attack())
            .sum()
    }

    pub fn total_defense(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.effective_defense())
            .sum()
    }

    pub fn total_health(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.health)
            .sum()
    }

    /// Calculate fleet speed (slowest ship determines speed)
    pub fn speed(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.ship_type.base_stats().speed)
            .min()
            .unwrap_or(0)
    }

    /// Calculate total cargo capacity
    pub fn cargo_capacity(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.ship_type.base_stats().cargo_capacity)
            .sum()
    }

    /// Calculate fuel consumption for traveling one sector
    pub fn fuel_consumption(&self) -> u32 {
        self.ships.iter()
            .filter(|s| s.is_alive())
            .map(|s| s.ship_type.base_stats().fuel_consumption)
            .sum()
    }

    /// Check if fleet is destroyed
    pub fn is_destroyed(&self) -> bool {
        self.ships.iter().all(|s| !s.is_alive())
    }

    /// Count alive ships by type
    pub fn count_ships(&self, ship_type: ShipType) -> usize {
        self.ships.iter()
            .filter(|s| s.is_alive() && s.ship_type == ship_type)
            .count()
    }

    /// Serialize fleet data for commit hash
    pub fn to_bytes(&self) -> Vec<u8> {
        bcs::to_bytes(self).unwrap_or_default()
    }
}

/// A committed fleet hash for Fog of War
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FleetCommitment {
    pub fleet_id: FleetId,
    pub owner: AccountOwner,
    pub position: Coordinate,
    /// SHA3-256(fleet_data || salt)
    pub hash: CommitHash,
    pub commit_time: Timestamp,
    /// Whether the fleet has been revealed
    pub revealed: bool,
}

impl FleetCommitment {
    /// Verify a reveal against the commitment
    pub fn verify_reveal(&self, fleet: &Fleet, salt: &Salt) -> bool {
        use sha3::{Sha3_256, Digest};
        
        let mut hasher = Sha3_256::new();
        hasher.update(&fleet.to_bytes());
        hasher.update(salt);
        let result = hasher.finalize();
        
        result.as_slice() == self.hash
    }
}

/// Ship construction queue entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShipConstructionOrder {
    pub ship_type: ShipType,
    pub quantity: u32,
    pub started_at: Timestamp,
    pub completes_at: Timestamp,
}
