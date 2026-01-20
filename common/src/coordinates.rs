//! Coordinate system for the Linera Dominion galaxy
//!
//! Implements spatial hashing for Region Chain addressing and
//! distance calculations for fleet movement.

use async_graphql::{SimpleObject, InputObject};
use serde::{Deserialize, Serialize};
use sha3::{Sha3_256, Digest};

/// A 2D coordinate in the galaxy
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash, Default, SimpleObject, InputObject)]
#[graphql(input_name = "CoordinateInput")]
pub struct Coordinate {
    pub x: i64,
    pub y: i64,
}

impl Coordinate {
    pub fn new(x: i64, y: i64) -> Self {
        Self { x, y }
    }

    pub fn origin() -> Self {
        Self::new(0, 0)
    }

    /// Calculate Euclidean distance to another coordinate
    pub fn distance_to(&self, other: &Coordinate) -> f64 {
        let dx = (self.x - other.x) as f64;
        let dy = (self.y - other.y) as f64;
        (dx * dx + dy * dy).sqrt()
    }

    /// Calculate Manhattan distance (for movement cost)
    pub fn manhattan_distance(&self, other: &Coordinate) -> u64 {
        ((self.x - other.x).abs() + (self.y - other.y).abs()) as u64
    }

    /// Get the sector this coordinate belongs to
    pub fn to_sector(&self, sector_size: i64) -> SectorCoordinate {
        SectorCoordinate {
            x: self.x.div_euclid(sector_size),
            y: self.y.div_euclid(sector_size),
        }
    }

    /// Check if coordinate is within a sector
    pub fn in_sector(&self, sector: &SectorCoordinate, sector_size: i64) -> bool {
        self.to_sector(sector_size) == *sector
    }
}

impl std::fmt::Display for Coordinate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

/// A sector coordinate (for Region Chain addressing)
/// Each sector is managed by a single Region Chain
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
pub struct SectorCoordinate {
    pub x: i64,
    pub y: i64,
}

impl SectorCoordinate {
    pub fn new(x: i64, y: i64) -> Self {
        Self { x, y }
    }

    /// Generate a deterministic Chain ID hash for this sector
    /// ChainID = Hash(Sector_X, Sector_Y, Universe_Seed)
    pub fn to_chain_id_bytes(&self, universe_seed: &[u8; 32]) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"LINERA_DOMINION_SECTOR_V1");
        hasher.update(self.x.to_le_bytes());
        hasher.update(self.y.to_le_bytes());
        hasher.update(universe_seed);
        
        let result = hasher.finalize();
        let mut output = [0u8; 32];
        output.copy_from_slice(&result);
        output
    }

    /// Get all adjacent sectors (including diagonals)
    pub fn adjacent_sectors(&self) -> [SectorCoordinate; 8] {
        [
            SectorCoordinate::new(self.x - 1, self.y - 1),
            SectorCoordinate::new(self.x, self.y - 1),
            SectorCoordinate::new(self.x + 1, self.y - 1),
            SectorCoordinate::new(self.x - 1, self.y),
            SectorCoordinate::new(self.x + 1, self.y),
            SectorCoordinate::new(self.x - 1, self.y + 1),
            SectorCoordinate::new(self.x, self.y + 1),
            SectorCoordinate::new(self.x + 1, self.y + 1),
        ]
    }

    /// Calculate Chebyshev distance (sectors)
    pub fn sector_distance(&self, other: &SectorCoordinate) -> u64 {
        std::cmp::max(
            (self.x - other.x).unsigned_abs(),
            (self.y - other.y).unsigned_abs(),
        )
    }

    /// Get quadrant for cell division (auto-sharding)
    pub fn quadrant(&self) -> Quadrant {
        match (self.x >= 0, self.y >= 0) {
            (true, true) => Quadrant::NorthEast,
            (false, true) => Quadrant::NorthWest,
            (false, false) => Quadrant::SouthWest,
            (true, false) => Quadrant::SouthEast,
        }
    }

    /// Split sector into 4 sub-sectors for dynamic sharding
    pub fn subdivide(&self) -> [SubSectorCoordinate; 4] {
        [
            SubSectorCoordinate {
                sector: *self,
                sub_x: 0,
                sub_y: 0,
            },
            SubSectorCoordinate {
                sector: *self,
                sub_x: 1,
                sub_y: 0,
            },
            SubSectorCoordinate {
                sector: *self,
                sub_x: 0,
                sub_y: 1,
            },
            SubSectorCoordinate {
                sector: *self,
                sub_x: 1,
                sub_y: 1,
            },
        ]
    }
}

impl std::fmt::Display for SectorCoordinate {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Sector[{}, {}]", self.x, self.y)
    }
}

/// Quadrant designation for cell division
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Quadrant {
    NorthEast,
    NorthWest,
    SouthWest,
    SouthEast,
}

/// Sub-sector coordinate for dynamic sharding
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct SubSectorCoordinate {
    pub sector: SectorCoordinate,
    /// 0 or 1 for quadtree subdivision
    pub sub_x: u8,
    pub sub_y: u8,
}

impl SubSectorCoordinate {
    pub fn to_chain_id_bytes(&self, universe_seed: &[u8; 32]) -> [u8; 32] {
        let mut hasher = Sha3_256::new();
        hasher.update(b"LINERA_DOMINION_SUBSECTOR_V1");
        hasher.update(self.sector.x.to_le_bytes());
        hasher.update(self.sector.y.to_le_bytes());
        hasher.update([self.sub_x, self.sub_y]);
        hasher.update(universe_seed);
        
        let result = hasher.finalize();
        let mut output = [0u8; 32];
        output.copy_from_slice(&result);
        output
    }
}

/// Calculate travel time between two coordinates
pub fn calculate_travel_time(
    from: &Coordinate,
    to: &Coordinate,
    fleet_speed: u32,
) -> u64 {
    if fleet_speed == 0 {
        return u64::MAX;
    }
    
    let distance = from.distance_to(to);
    // Base time: 1 second per unit distance, divided by speed factor
    let base_time = (distance * 1000.0) as u64;
    base_time / fleet_speed as u64
}

/// Path finding result for fleet movement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlightPath {
    pub origin: Coordinate,
    pub destination: Coordinate,
    pub waypoints: Vec<SectorCoordinate>,
    pub total_distance: f64,
    pub estimated_time: u64,
    pub fuel_required: u128,
}

impl FlightPath {
    /// Generate a simple direct path through sectors
    pub fn direct(
        origin: Coordinate,
        destination: Coordinate,
        fleet_speed: u32,
        fuel_per_sector: u32,
        sector_size: i64,
    ) -> Self {
        let origin_sector = origin.to_sector(sector_size);
        let dest_sector = destination.to_sector(sector_size);
        
        let mut waypoints = Vec::new();
        let mut current = origin_sector;
        
        // Simple line drawing through sectors
        while current != dest_sector {
            let dx = (dest_sector.x - current.x).signum();
            let dy = (dest_sector.y - current.y).signum();
            
            current = SectorCoordinate::new(current.x + dx, current.y + dy);
            waypoints.push(current);
        }
        
        let total_distance = origin.distance_to(&destination);
        let estimated_time = calculate_travel_time(&origin, &destination, fleet_speed);
        let sectors_crossed = waypoints.len() as u128;
        let fuel_required = sectors_crossed * fuel_per_sector as u128;
        
        Self {
            origin,
            destination,
            waypoints,
            total_distance,
            estimated_time,
            fuel_required,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sector_coordinate() {
        let coord = Coordinate::new(150, 250);
        let sector = coord.to_sector(100);
        assert_eq!(sector, SectorCoordinate::new(1, 2));
    }

    #[test]
    fn test_distance() {
        let a = Coordinate::new(0, 0);
        let b = Coordinate::new(3, 4);
        assert!((a.distance_to(&b) - 5.0).abs() < 0.001);
    }

    #[test]
    fn test_negative_sector() {
        let coord = Coordinate::new(-150, -250);
        let sector = coord.to_sector(100);
        assert_eq!(sector, SectorCoordinate::new(-2, -3));
    }
}
