//! Resource definitions for Linera Dominion
//!
//! Implements the Time-Energy Standard economic model with lazy evaluation
//! for resource generation based on delta-time integration.

use async_graphql::{SimpleObject, InputObject};
use linera_sdk::linera_base_types::Timestamp;
use serde::{Deserialize, Serialize};

use crate::types::BuildingType;
use crate::constants::{
    IRON_BASE_RATE, DEUTERIUM_BASE_RATE, CRYSTALS_BASE_RATE,
    IRON_SCALING_FACTOR, DEUTERIUM_SCALING_FACTOR, CRYSTALS_SCALING_FACTOR,
    STAKE_DECAY_RATE_PER_HOUR,
};

/// The three primary resources in Linera Dominion
/// Note: We use String for u128 fields because GraphQL doesn't support u128
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default, PartialEq, Eq)]
pub struct Resources {
    /// Common metal for basic construction
    pub iron: u128,
    /// Fuel for ships and advanced structures
    pub deuterium: u128,
    /// Rare resource for advanced tech and governance voting
    pub chronos_crystals: u128,
}

impl Resources {
    pub fn new(iron: u128, deuterium: u128, chronos_crystals: u128) -> Self {
        Self {
            iron,
            deuterium,
            chronos_crystals,
        }
    }

    pub fn zero() -> Self {
        Self::default()
    }

    /// Check if we have at least the specified amounts
    pub fn has_at_least(&self, other: &Resources) -> bool {
        self.iron >= other.iron
            && self.deuterium >= other.deuterium
            && self.chronos_crystals >= other.chronos_crystals
    }

    /// Saturating subtraction
    pub fn saturating_sub(&self, other: &Resources) -> Resources {
        Resources {
            iron: self.iron.saturating_sub(other.iron),
            deuterium: self.deuterium.saturating_sub(other.deuterium),
            chronos_crystals: self.chronos_crystals.saturating_sub(other.chronos_crystals),
        }
    }

    /// Add resources
    pub fn saturating_add(&self, other: &Resources) -> Resources {
        Resources {
            iron: self.iron.saturating_add(other.iron),
            deuterium: self.deuterium.saturating_add(other.deuterium),
            chronos_crystals: self.chronos_crystals.saturating_add(other.chronos_crystals),
        }
    }

    /// Check if all resources are zero
    pub fn is_zero(&self) -> bool {
        self.iron == 0 && self.deuterium == 0 && self.chronos_crystals == 0
    }

    /// Total value (simplified for voting weight)
    pub fn total_value(&self) -> u128 {
        // Chronos crystals are worth more
        self.iron + self.deuterium * 2 + self.chronos_crystals * 100
    }
}

impl std::ops::Add for Resources {
    type Output = Resources;

    fn add(self, rhs: Self) -> Self::Output {
        self.saturating_add(&rhs)
    }
}

impl std::ops::Sub for Resources {
    type Output = Resources;

    fn sub(self, rhs: Self) -> Self::Output {
        self.saturating_sub(&rhs)
    }
}

impl std::ops::AddAssign for Resources {
    fn add_assign(&mut self, rhs: Self) {
        *self = self.saturating_add(&rhs);
    }
}

impl std::ops::SubAssign for Resources {
    fn sub_assign(&mut self, rhs: Self) {
        *self = self.saturating_sub(&rhs);
    }
}

/// Resource wallet with lazy evaluation support
/// 
/// Uses the formula: R_current = R_last + (Rate × (T_now - T_last))
/// This ensures infinite precision without needing ticker transactions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceWallet {
    /// Base resources (last calculated values)
    pub resources: Resources,
    /// Timestamp of last resource calculation
    pub last_update: Timestamp,
    /// Production rates per second for each resource
    pub production_rates: ProductionRates,
}

impl Default for ResourceWallet {
    fn default() -> Self {
        Self {
            resources: Resources::default(),
            last_update: Timestamp::from(0),
            production_rates: ProductionRates::default(),
        }
    }
}

impl ResourceWallet {
    pub fn new(initial_resources: Resources, timestamp: Timestamp) -> Self {
        Self {
            resources: initial_resources,
            last_update: timestamp,
            production_rates: ProductionRates::default(),
        }
    }

    /// Calculate current resources using delta-time integration
    /// R_current = R_last + (Rate × (T_now - T_last))
    pub fn calculate_current(&self, now: Timestamp) -> Resources {
        let elapsed_micros = now.micros().saturating_sub(self.last_update.micros());
        let elapsed_seconds = elapsed_micros / 1_000_000;

        Resources {
            iron: self.resources.iron
                .saturating_add(self.production_rates.iron_per_second as u128 * elapsed_seconds as u128),
            deuterium: self.resources.deuterium
                .saturating_add(self.production_rates.deuterium_per_second as u128 * elapsed_seconds as u128),
            chronos_crystals: self.resources.chronos_crystals
                .saturating_add(self.production_rates.crystals_per_second as u128 * elapsed_seconds as u128),
        }
    }

    /// Update the wallet to the current timestamp
    pub fn update_to_now(&mut self, now: Timestamp) {
        self.resources = self.calculate_current(now);
        self.last_update = now;
    }

    /// Debit resources (update first, then subtract)
    pub fn debit(&mut self, amount: &Resources, now: Timestamp) -> Result<(), ResourceError> {
        self.update_to_now(now);
        
        if !self.resources.has_at_least(amount) {
            return Err(ResourceError::InsufficientResources {
                required: *amount,
                available: self.resources,
            });
        }

        self.resources -= *amount;
        Ok(())
    }

    /// Credit resources
    pub fn credit(&mut self, amount: &Resources, now: Timestamp) {
        self.update_to_now(now);
        self.resources += *amount;
    }
}

/// Production rates for resource generation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, Default)]
pub struct ProductionRates {
    /// Iron per second (scaled by 1000 for precision)
    pub iron_per_second: u64,
    /// Deuterium per second (scaled by 1000 for precision)
    pub deuterium_per_second: u64,
    /// Chronos Crystals per second (scaled by 1000000 for precision)
    pub crystals_per_second: u64,
}

impl ProductionRates {
    /// Calculate production rates based on building levels
    pub fn from_buildings(buildings: &[(BuildingType, u32)]) -> Self {
        let mut rates = ProductionRates::default();

        for (building_type, level) in buildings {
            match building_type {
                BuildingType::MinerDrone => {
                    // Base rate * scaling_factor^level
                    let rate = Self::calculate_rate(
                        IRON_BASE_RATE,
                        IRON_SCALING_FACTOR,
                        *level,
                    );
                    rates.iron_per_second += rate;
                }
                BuildingType::GasSiphon => {
                    let rate = Self::calculate_rate(
                        DEUTERIUM_BASE_RATE,
                        DEUTERIUM_SCALING_FACTOR,
                        *level,
                    );
                    rates.deuterium_per_second += rate;
                }
                BuildingType::ChronosCollider => {
                    let rate = Self::calculate_rate(
                        CRYSTALS_BASE_RATE,
                        CRYSTALS_SCALING_FACTOR,
                        *level,
                    );
                    rates.crystals_per_second += rate;
                }
                _ => {}
            }
        }

        rates
    }

    /// Calculate rate with exponential scaling
    /// rate = base_rate * (scaling_factor ^ level) / 3600 (convert from hourly)
    fn calculate_rate(base_rate_hourly: u64, scaling_factor: u64, level: u32) -> u64 {
        if level == 0 {
            return 0;
        }
        
        // Scaling factor is stored as fixed point (150 = 1.5x)
        let mut rate = base_rate_hourly as u128;
        for _ in 1..level {
            rate = rate * scaling_factor as u128 / 100;
        }
        
        // Convert from hourly to per-second
        (rate / 3600) as u64
    }
}

/// Calculate stake decay based on time elapsed
pub fn calculate_stake_decay(stake: &Resources, elapsed_hours: u64) -> Resources {
    let decay_factor = STAKE_DECAY_RATE_PER_HOUR * elapsed_hours;
    let decay_factor = std::cmp::min(decay_factor, 100); // Cap at 100% decay
    
    Resources {
        iron: stake.iron * (100 - decay_factor) as u128 / 100,
        deuterium: stake.deuterium * (100 - decay_factor) as u128 / 100,
        chronos_crystals: stake.chronos_crystals * (100 - decay_factor) as u128 / 100,
    }
}

/// Errors related to resource operations
#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
pub enum ResourceError {
    #[error("Insufficient resources: required {required:?}, available {available:?}")]
    InsufficientResources {
        required: Resources,
        available: Resources,
    },
    #[error("Invalid resource amount")]
    InvalidAmount,
}
