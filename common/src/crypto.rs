//! Cryptographic utilities for Linera Dominion
//!
//! Implements commit-reveal scheme for Fog of War and other crypto operations.

use sha3::{Sha3_256, Digest};
use serde::{Deserialize, Serialize};

use crate::types::{CommitHash, Salt};
use crate::units::Fleet;

/// Generate a random salt (in production, use proper randomness)
pub fn generate_salt(seed: &[u8]) -> Salt {
    let mut hasher = Sha3_256::new();
    hasher.update(b"LINERA_DOMINION_SALT_V1");
    hasher.update(seed);
    
    let result = hasher.finalize();
    let mut salt = [0u8; 32];
    salt.copy_from_slice(&result);
    salt
}

/// Create a commitment hash for a fleet
/// FleetHash = SHA3_256(FleetData || Salt)
pub fn commit_fleet(fleet: &Fleet, salt: &Salt) -> CommitHash {
    let fleet_bytes = bcs::to_bytes(fleet).unwrap_or_default();
    
    let mut hasher = Sha3_256::new();
    hasher.update(&fleet_bytes);
    hasher.update(salt);
    
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

/// Verify a fleet reveal against a commitment
pub fn verify_fleet_reveal(fleet: &Fleet, salt: &Salt, commitment: &CommitHash) -> bool {
    let computed = commit_fleet(fleet, salt);
    computed == *commitment
}

/// Generate a deterministic hash for procedural generation
pub fn procedural_hash(seed: &[u8; 32], x: i64, y: i64, purpose: &str) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(b"LINERA_DOMINION_PROCEDURAL_V1");
    hasher.update(seed);
    hasher.update(x.to_le_bytes());
    hasher.update(y.to_le_bytes());
    hasher.update(purpose.as_bytes());
    
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

/// Generate planet name from procedural hash
pub fn generate_planet_name(seed: &[u8; 32], x: i64, y: i64) -> String {
    let hash = procedural_hash(seed, x, y, "planet_name");
    
    // Syllable-based name generation
    const PREFIXES: &[&str] = &[
        "Al", "Bel", "Cor", "Dra", "El", "Far", "Gal", "Hel", 
        "Ion", "Kel", "Lyr", "Mal", "Neb", "Ori", "Pax", "Qua",
        "Rig", "Sol", "Tau", "Ura", "Veg", "Wol", "Xen", "Yed", "Zet"
    ];
    
    const MIDDLES: &[&str] = &[
        "ar", "en", "ir", "on", "ur", "ax", "ex", "ix", "ox", "ux",
        "an", "in", "un", "as", "is", "os", "us", "at", "et", "it"
    ];
    
    const SUFFIXES: &[&str] = &[
        "a", "i", "o", "us", "is", "on", "ar", "or", "ix", "ax",
        "ia", "io", "ius", "ium", "ara", "ora", "ira", "ura", "era"
    ];
    
    let prefix_idx = hash[0] as usize % PREFIXES.len();
    let middle_idx = hash[1] as usize % MIDDLES.len();
    let suffix_idx = hash[2] as usize % SUFFIXES.len();
    
    format!("{}{}{}", PREFIXES[prefix_idx], MIDDLES[middle_idx], SUFFIXES[suffix_idx])
}

/// Generate planet type from procedural hash
pub fn generate_planet_type(seed: &[u8; 32], x: i64, y: i64) -> crate::types::PlanetType {
    let hash = procedural_hash(seed, x, y, "planet_type");
    
    use crate::types::PlanetType;
    
    // Weighted distribution
    match hash[0] % 100 {
        0..=24 => PlanetType::Terrestrial,   // 25%
        25..=44 => PlanetType::Metallic,     // 20%
        45..=64 => PlanetType::GasGiant,     // 20%
        65..=79 => PlanetType::Barren,       // 15%
        80..=89 => PlanetType::Volcanic,     // 10%
        90..=99 => PlanetType::Temporal,     // 10% (rare Chronos Crystal deposits)
        _ => PlanetType::Terrestrial,
    }
}

/// Check if a coordinate has a planet (probability-based)
pub fn has_planet(seed: &[u8; 32], x: i64, y: i64) -> bool {
    let hash = procedural_hash(seed, x, y, "has_planet");
    
    // 15% chance of planet at any coordinate
    hash[0] < 38 // 38/256 ≈ 15%
}

/// Commitment structure for secure transactions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commitment<T> {
    pub hash: CommitHash,
    pub created_at: u64,
    pub revealed: bool,
    _phantom: std::marker::PhantomData<T>,
}

impl<T: Serialize> Commitment<T> {
    pub fn new(data: &T, salt: &Salt, timestamp: u64) -> Self {
        let data_bytes = bcs::to_bytes(data).unwrap_or_default();
        
        let mut hasher = Sha3_256::new();
        hasher.update(&data_bytes);
        hasher.update(salt);
        
        let result = hasher.finalize();
        let mut hash = [0u8; 32];
        hash.copy_from_slice(&result);
        
        Self {
            hash,
            created_at: timestamp,
            revealed: false,
            _phantom: std::marker::PhantomData,
        }
    }
    
    pub fn verify(&self, data: &T, salt: &Salt) -> bool {
        let data_bytes = bcs::to_bytes(data).unwrap_or_default();
        
        let mut hasher = Sha3_256::new();
        hasher.update(&data_bytes);
        hasher.update(salt);
        
        let result = hasher.finalize();
        result.as_slice() == self.hash
    }
}

/// Hash a message ID with chain ID for replay protection
pub fn message_hash(msg_id: u64, chain_id: &[u8]) -> [u8; 32] {
    let mut hasher = Sha3_256::new();
    hasher.update(msg_id.to_le_bytes());
    hasher.update(chain_id);
    
    let result = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&result);
    hash
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::units::{Ship, ShipType};
    use crate::coordinates::Coordinate;
    use linera_sdk::linera_base_types::{AccountOwner, ChainId, Timestamp};

    #[test]
    fn test_commit_reveal() {
        // Create a simple fleet for testing
        let fleet = Fleet {
            id: 1,
            owner: AccountOwner::User(linera_sdk::linera_base_types::CryptoHash::test_hash("test")),
            owner_chain: ChainId::root(0),
            ships: vec![Ship::new(ShipType::Scout)],
            cargo: crate::resources::Resources::zero(),
            position: Coordinate::new(0, 0),
            state: crate::types::FleetState::Idle,
            last_update: Timestamp::from(0),
        };
        
        let salt = generate_salt(b"test_seed");
        let commitment = commit_fleet(&fleet, &salt);
        
        // Verify should succeed with correct data
        assert!(verify_fleet_reveal(&fleet, &salt, &commitment));
        
        // Verify should fail with wrong salt
        let wrong_salt = generate_salt(b"wrong_seed");
        assert!(!verify_fleet_reveal(&fleet, &wrong_salt, &commitment));
    }

    #[test]
    fn test_procedural_generation() {
        let seed = crate::constants::DEFAULT_UNIVERSE_SEED;
        
        // Same inputs should produce same outputs
        let name1 = generate_planet_name(&seed, 10, 20);
        let name2 = generate_planet_name(&seed, 10, 20);
        assert_eq!(name1, name2);
        
        // Different coordinates should produce different names (usually)
        let name3 = generate_planet_name(&seed, 11, 20);
        assert_ne!(name1, name3);
    }
}
