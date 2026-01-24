//! Dominion State - User Chain state storage

use async_graphql::SimpleObject;
use linera_sdk::{
    linera_base_types::{ChainId, Timestamp},
    views::{linera_views, MapView, RegisterView, RootView, ViewStorageContext},
};
use linera_dominion_common::coordinates::Coordinate;
use serde::{Deserialize, Serialize};

// ==================== DATA TYPES ====================

/// Wallet data for resource storage
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct WalletData {
    pub iron: u64,
    pub deuterium: u64,
    pub crystals: u64,
    pub last_update_micros: u64,
}

/// Building data
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct BuildingData {
    pub building_type: u8,
    pub level: u32,
    pub x: i64,
    pub y: i64,
    pub construction_end_micros: Option<u64>,
}

/// Fleet data
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct FleetData {
    pub name: String,
    pub ships: Vec<u32>, // Ship counts by type
    pub status: u8,      // 0=idle, 1=traveling, 2=attacking, etc.
    pub current_x: i64,
    pub current_y: i64,
    pub dest_x: i64,
    pub dest_y: i64,
    pub arrival_micros: Option<u64>,
}

/// Trade offer data
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct TradeOfferData {
    pub offer_iron: u64,
    pub offer_deuterium: u64,
    pub offer_crystals: u64,
    pub request_iron: u64,
    pub request_deuterium: u64,
    pub request_crystals: u64,
    pub expires_micros: u64,
}

/// Research data
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct ResearchData {
    pub technology_type: u8,
    pub level: u32,
    pub completion_micros: Option<u64>,
}

/// Alliance data
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct AllianceData {
    pub name: String,
    pub role: u8, // 0=member, 1=officer, 2=leader
}

/// Diplomacy status with another player
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct DiplomacyData {
    pub status: u8,             // 0=neutral, 1=allied, 2=at_war, 3=peace_pending
    pub alliance_name: Option<String>,
    pub started_micros: u64,
}

/// Alliance/Diplomacy proposal
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct ProposalData {
    pub proposal_type: u8,      // 0=alliance, 1=peace
    pub sender_chain: String,   // ChainId as string
    pub alliance_name: Option<String>,
    pub created_micros: u64,
    pub expires_micros: u64,
}

/// Invasion record
#[derive(Debug, Clone, Default, Serialize, Deserialize, SimpleObject)]
pub struct InvasionData {
    pub attacker_chain: String, // ChainId as string
    pub defender_chain: String,
    pub attacker_fleet_id: u64,
    pub target_x: i64,
    pub target_y: i64,
    pub status: u8,             // 0=pending, 1=in_progress, 2=victory, 3=defeat
    pub attacker_strength: u64,
    pub defender_strength: u64,
    pub loot_iron: u64,
    pub loot_deuterium: u64,
    pub loot_crystals: u64,
    pub started_micros: u64,
    pub resolved_micros: Option<u64>,
}

// ==================== STATE VIEW ====================

/// Root state for a Dominion (user chain)
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct DominionState {
    /// Owner info
    name: RegisterView<String>,
    home_x: RegisterView<i64>,
    home_y: RegisterView<i64>,
    
    /// Resources
    wallet: RegisterView<WalletData>,
    
    /// Buildings: key = building_id
    buildings: MapView<u64, BuildingData>,
    building_count: RegisterView<u64>,
    
    /// Fleets: key = fleet_id
    fleets: MapView<u64, FleetData>,
    fleet_count: RegisterView<u64>,
    
    /// Ship pool (available ships not in fleets): key = ship_type as u8
    ship_pool: MapView<u8, u32>,
    
    /// Research: key = tech_type as u8
    research: MapView<u8, ResearchData>,
    
    /// Trade offers: key = offer_id
    trades: MapView<u64, TradeOfferData>,
    trade_count: RegisterView<u64>,
    
    /// Alliance membership
    alliance: RegisterView<Option<AllianceData>>,
    
    /// Diplomacy status: key = other player's chain_id as string
    diplomacy: MapView<String, DiplomacyData>,
    
    /// Pending proposals: key = proposal_id
    proposals: MapView<u64, ProposalData>,
    proposal_count: RegisterView<u64>,
    
    /// Invasion records: key = invasion_id
    invasions: MapView<u64, InvasionData>,
    invasion_count: RegisterView<u64>,
}

// ==================== STATE IMPLEMENTATION ====================

impl DominionState {
    // --- Getters ---
    
    pub fn name(&self) -> &RegisterView<String> {
        &self.name
    }
    
    pub fn home_x(&self) -> &RegisterView<i64> {
        &self.home_x
    }
    
    pub fn home_y(&self) -> &RegisterView<i64> {
        &self.home_y
    }
    
    pub fn wallet(&self) -> &RegisterView<WalletData> {
        &self.wallet
    }
    
    pub fn buildings(&self) -> &MapView<u64, BuildingData> {
        &self.buildings
    }
    
    pub fn building_count(&self) -> &RegisterView<u64> {
        &self.building_count
    }
    
    pub fn fleets(&self) -> &MapView<u64, FleetData> {
        &self.fleets
    }
    
    pub fn fleet_count(&self) -> &RegisterView<u64> {
        &self.fleet_count
    }
    
    pub fn ship_pool(&self) -> &MapView<u8, u32> {
        &self.ship_pool
    }
    
    pub fn research(&self) -> &MapView<u8, ResearchData> {
        &self.research
    }
    
    pub fn trades(&self) -> &MapView<u64, TradeOfferData> {
        &self.trades
    }
    
    pub fn trade_count(&self) -> &RegisterView<u64> {
        &self.trade_count
    }
    
    pub fn alliance(&self) -> &RegisterView<Option<AllianceData>> {
        &self.alliance
    }
    
    // --- Mutable getters ---
    
    pub fn name_mut(&mut self) -> &mut RegisterView<String> {
        &mut self.name
    }
    
    pub fn home_x_mut(&mut self) -> &mut RegisterView<i64> {
        &mut self.home_x
    }
    
    pub fn home_y_mut(&mut self) -> &mut RegisterView<i64> {
        &mut self.home_y
    }
    
    pub fn wallet_mut(&mut self) -> &mut RegisterView<WalletData> {
        &mut self.wallet
    }
    
    pub fn buildings_mut(&mut self) -> &mut MapView<u64, BuildingData> {
        &mut self.buildings
    }
    
    pub fn building_count_mut(&mut self) -> &mut RegisterView<u64> {
        &mut self.building_count
    }
    
    pub fn fleets_mut(&mut self) -> &mut MapView<u64, FleetData> {
        &mut self.fleets
    }
    
    pub fn fleet_count_mut(&mut self) -> &mut RegisterView<u64> {
        &mut self.fleet_count
    }
    
    pub fn ship_pool_mut(&mut self) -> &mut MapView<u8, u32> {
        &mut self.ship_pool
    }
    
    pub fn research_mut(&mut self) -> &mut MapView<u8, ResearchData> {
        &mut self.research
    }
    
    pub fn trades_mut(&mut self) -> &mut MapView<u64, TradeOfferData> {
        &mut self.trades
    }
    
    pub fn trade_count_mut(&mut self) -> &mut RegisterView<u64> {
        &mut self.trade_count
    }
    
    pub fn alliance_mut(&mut self) -> &mut RegisterView<Option<AllianceData>> {
        &mut self.alliance
    }
    
    // --- Business logic ---
    
    /// Initialize a new dominion
    pub fn initialize(
        &mut self,
        home: Coordinate,
        starting_iron: u64,
        starting_deuterium: u64,
        starting_crystals: u64,
        now_micros: u64,
    ) {
        self.home_x.set(home.x);
        self.home_y.set(home.y);
        self.wallet.set(WalletData {
            iron: starting_iron,
            deuterium: starting_deuterium,
            crystals: starting_crystals,
            last_update_micros: now_micros,
        });
        self.building_count.set(0);
        self.fleet_count.set(0);
        self.trade_count.set(0);
        self.alliance.set(None);
    }
    
    /// Update wallet with time-based resource production
    pub fn update_wallet(&mut self, now_micros: u64, production_rate_per_hour: u64) {
        let mut wallet = self.wallet.get().clone();
        let elapsed_micros = now_micros.saturating_sub(wallet.last_update_micros);
        let hours = elapsed_micros as f64 / (3600.0 * 1_000_000.0);
        let produced = (hours * production_rate_per_hour as f64) as u64;
        
        wallet.iron = wallet.iron.saturating_add(produced);
        wallet.deuterium = wallet.deuterium.saturating_add(produced / 2);
        wallet.last_update_micros = now_micros;
        
        self.wallet.set(wallet);
    }
    
    /// Debit resources from wallet
    pub fn debit_resources(
        &mut self,
        iron: u64,
        deuterium: u64,
        crystals: u64,
        now_micros: u64,
    ) -> Result<(), String> {
        let mut wallet = self.wallet.get().clone();
        
        if wallet.iron < iron {
            return Err(format!("Insufficient iron: have {}, need {}", wallet.iron, iron));
        }
        if wallet.deuterium < deuterium {
            return Err(format!("Insufficient deuterium: have {}, need {}", wallet.deuterium, deuterium));
        }
        if wallet.crystals < crystals {
            return Err(format!("Insufficient crystals: have {}, need {}", wallet.crystals, crystals));
        }
        
        wallet.iron -= iron;
        wallet.deuterium -= deuterium;
        wallet.crystals -= crystals;
        wallet.last_update_micros = now_micros;
        
        self.wallet.set(wallet);
        Ok(())
    }
    
    /// Credit resources to wallet
    pub fn credit_resources(
        &mut self,
        iron: u64,
        deuterium: u64,
        crystals: u64,
        now_micros: u64,
    ) {
        let mut wallet = self.wallet.get().clone();
        wallet.iron = wallet.iron.saturating_add(iron);
        wallet.deuterium = wallet.deuterium.saturating_add(deuterium);
        wallet.crystals = wallet.crystals.saturating_add(crystals);
        wallet.last_update_micros = now_micros;
        self.wallet.set(wallet);
    }
}
