//! # Linera Dominion Common
//! 
//! Shared types, constants, and utilities for the Linera Dominion MMORTS.
//! This crate defines the core data structures used across all chain types:
//! - User Chains (personal empire management)
//! - Region Chains (spatial sharding layer)
//! - Battle Chains (ephemeral combat instances)
//! - Alliance Chains (DAO governance)

pub mod types;
pub mod resources;
pub mod units;
pub mod coordinates;
pub mod messages;
pub mod errors;
pub mod constants;
pub mod crypto;

pub use types::*;
pub use resources::*;
pub use units::*;
pub use coordinates::*;
pub use messages::*;
pub use errors::*;
pub use constants::*;
pub use crypto::*;
