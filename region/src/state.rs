//! State management for the Region Chain

use async_graphql::SimpleObject;
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct FleetPresenceData {
    pub fleet_id: u64,
    pub owner_chain: String,
    pub position_x: i64,
    pub position_y: i64,
    pub commitment_hash: String,
    pub arrived_at_micros: u64,
    pub revealed: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct PlanetData {
    pub id: u64,
    pub x: i64,
    pub y: i64,
    pub planet_type: u8,
    pub owner_chain: String,
    pub stake_iron: u64,
    pub stake_deuterium: u64,
    pub stake_crystals: u64,
    pub stake_updated_micros: u64,
    pub name: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct DebrisData {
    pub x: i64,
    pub y: i64,
    pub iron: u64,
    pub deuterium: u64,
    pub created_at_micros: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct BattleRef {
    pub battle_id: u64,
    pub battle_chain: String,
    pub x: i64,
    pub y: i64,
    pub started_at_micros: u64,
}

#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct RegionState {
    pub sector_x: RegisterView<i64>,
    pub sector_y: RegisterView<i64>,
    pub universe_seed: RegisterView<u64>,
    pub fleets: MapView<u64, FleetPresenceData>,
    pub fleet_count: RegisterView<u64>,
    pub planets: MapView<u64, PlanetData>,
    pub planet_count: RegisterView<u64>,
    pub debris: MapView<u64, DebrisData>,
    pub debris_count: RegisterView<u64>,
    pub battles: MapView<u64, BattleRef>,
    pub battle_count: RegisterView<u64>,
    pub is_subdivided: RegisterView<bool>,
}

impl RegionState {
    pub fn initialize(&mut self, sector_x: i64, sector_y: i64, universe_seed: u64) {
        self.sector_x.set(sector_x);
        self.sector_y.set(sector_y);
        self.universe_seed.set(universe_seed);
        self.fleet_count.set(0);
        self.planet_count.set(0);
        self.debris_count.set(0);
        self.battle_count.set(0);
        self.is_subdivided.set(false);
    }
}
