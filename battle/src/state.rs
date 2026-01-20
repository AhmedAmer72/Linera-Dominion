//! State management for the Battle Chain

use async_graphql::SimpleObject;
use linera_sdk::views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct CombatantData {
    pub owner_chain: String,
    pub ships: Vec<u32>,
    pub remaining_ships: Vec<u32>,
    pub bonded_iron: u64,
    pub bonded_deuterium: u64,
    pub bonded_crystals: u64,
    pub is_defender: bool,
    pub has_retreated: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct TurnRecordData {
    pub actions: Vec<u8>,
    pub damages: Vec<u64>,
    pub losses: Vec<u32>,
    pub timestamp_micros: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct WarBondData {
    pub iron: u64,
    pub deuterium: u64,
    pub crystals: u64,
}

#[derive(RootView, SimpleObject)]
#[view(context = ViewStorageContext)]
pub struct BattleState {
    pub battle_id: RegisterView<u64>,
    pub region_chain: RegisterView<String>,
    pub position_x: RegisterView<i64>,
    pub position_y: RegisterView<i64>,
    pub current_turn: RegisterView<u32>,
    pub max_turns: RegisterView<u32>,
    pub turn_duration_micros: RegisterView<u64>,
    pub is_active: RegisterView<bool>,
    pub start_time_micros: RegisterView<u64>,
    pub combatants: MapView<u64, CombatantData>,
    pub combatant_count: RegisterView<u64>,
    pub turn_records: MapView<u32, TurnRecordData>,
    pub war_bonds: MapView<u64, WarBondData>,
}

impl BattleState {
    pub fn initialize(&mut self, max_turns: u32, turn_duration_micros: u64, now_micros: u64) {
        self.battle_id.set(0);
        self.region_chain.set(String::new());
        self.position_x.set(0);
        self.position_y.set(0);
        self.current_turn.set(0);
        self.max_turns.set(max_turns);
        self.turn_duration_micros.set(turn_duration_micros);
        self.is_active.set(true);
        self.start_time_micros.set(now_micros);
        self.combatant_count.set(0);
    }
}
