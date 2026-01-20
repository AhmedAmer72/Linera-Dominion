//! Dominion Contract - User Chain smart contract implementation

#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::{ChainId, WithContractAbi},
    Contract, ContractRuntime,
    views::{RootView, View},
};
use linera_dominion::{
    DominionState, DominionAbi, DominionError, DominionParameters,
    Operation, Message, BuildingType, ShipType, Technology,
    state::BuildingData,
};
use linera_dominion_common::coordinates::Coordinate;

pub struct DominionContract {
    state: DominionState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(DominionContract);

impl WithContractAbi for DominionContract {
    type Abi = DominionAbi;
}

impl Contract for DominionContract {
    type Message = Message;
    type Parameters = DominionParameters;
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = DominionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        let params = self.runtime.application_parameters();
        let now = self.runtime.system_time();
        
        let home = Coordinate::new(params.home_x, params.home_y);
        self.state.initialize(
            home,
            params.starting_iron,
            params.starting_deuterium,
            params.starting_crystals,
            now.micros(),
        );
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Result<(), DominionError> {
        let now = self.runtime.system_time();
        let now_micros = now.micros();
        
        match operation {
            Operation::Build { building_type, x, y } => {
                // Check resources
                let (cost_iron, cost_deut) = building_cost(building_type);
                self.state.debit_resources(cost_iron, cost_deut, 0, now_micros)
                    .map_err(|e| DominionError::InsufficientResources(e))?;
                
                // Add building
                let count = *self.state.building_count().get();
                let building = BuildingData {
                    building_type: building_type as u8,
                    level: 1,
                    x,
                    y,
                    construction_end_micros: Some(now_micros + 60_000_000), // 60 seconds
                };
                self.state.buildings_mut().insert(&count, building)
                    .map_err(|_| DominionError::InvalidOperation("Failed to add building".into()))?;
                self.state.building_count_mut().set(count + 1);
                
                Ok(())
            }
            
            Operation::CancelConstruction { building_id } => {
                // TODO: Implement construction cancellation
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::Research { technology } => {
                // TODO: Implement research
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::CancelResearch => {
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::BuildShips { ship_type, quantity } => {
                // Check resources
                let (cost_iron, cost_deut) = ship_cost(ship_type);
                let total_iron = cost_iron * quantity as u64;
                let total_deut = cost_deut * quantity as u64;
                
                self.state.debit_resources(total_iron, total_deut, 0, now_micros)
                    .map_err(|e| DominionError::InsufficientResources(e))?;
                
                // Add ships to pool
                let key = ship_type as u8;
                let current = self.state.ship_pool().get(&key).await
                    .map_err(|_| DominionError::InvalidOperation("Failed to get ship pool".into()))?
                    .unwrap_or(0);
                self.state.ship_pool_mut().insert(&key, current + quantity)
                    .map_err(|_| DominionError::InvalidOperation("Failed to add ships".into()))?;
                
                Ok(())
            }
            
            Operation::CreateFleet { ships, name: _ } => {
                // TODO: Implement fleet creation
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::DisbandFleet { fleet_id } => {
                Err(DominionError::FleetNotFound(fleet_id))
            }
            
            Operation::SendFleet { fleet_id, destination_x, destination_y, cargo } => {
                Err(DominionError::FleetNotFound(fleet_id))
            }
            
            Operation::RecallFleet { fleet_id } => {
                Err(DominionError::FleetNotFound(fleet_id))
            }
            
            Operation::CreateTrade { target_chain, offering, requesting } => {
                // TODO: Implement trade
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::AcceptTrade { offer_id } => {
                Err(DominionError::TradeNotFound(offer_id))
            }
            
            Operation::CancelTrade { offer_id } => {
                Err(DominionError::TradeNotFound(offer_id))
            }
            
            Operation::JoinAlliance { alliance_chain } => {
                if self.state.alliance().get().is_some() {
                    return Err(DominionError::AlreadyInAlliance);
                }
                Err(DominionError::InvalidOperation("Not implemented".into()))
            }
            
            Operation::LeaveAlliance => {
                if self.state.alliance().get().is_none() {
                    return Err(DominionError::NotInAlliance);
                }
                self.state.alliance_mut().set(None);
                Ok(())
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        let now = self.runtime.system_time();
        let _now_micros = now.micros();
        
        match message {
            Message::TradeOffer { offer_id, sender, sender_chain, .. } => {
                // TODO: Handle incoming trade offer
            }
            Message::TradeAccepted { offer_id } => {
                // TODO: Handle trade acceptance
            }
            Message::TradeCancelled { offer_id } => {
                // TODO: Handle trade cancellation
            }
            Message::FleetArrival { fleet_id, owner, owner_chain } => {
                // TODO: Handle fleet arrival notification
            }
            Message::BattleResult { battle_id, won, surviving_ships, .. } => {
                // TODO: Handle battle result
            }
            Message::AllianceInvite { alliance_chain, alliance_name } => {
                // TODO: Handle alliance invitation
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

/// Get building cost
fn building_cost(building_type: BuildingType) -> (u64, u64) {
    match building_type {
        BuildingType::MinerDrone => (100, 25),
        BuildingType::GasSiphon => (75, 100),
        BuildingType::ChronosCollider => (1000, 500),
        BuildingType::Shipyard => (400, 200),
        BuildingType::WarpGate => (2000, 1000),
        BuildingType::PlanetaryShield => (500, 250),
        BuildingType::ResearchLab => (200, 100),
        BuildingType::Warehouse => (150, 50),
        BuildingType::OrbitalCannon => (800, 400),
        BuildingType::SubspaceRelay => (300, 150),
    }
}

/// Get ship cost
fn ship_cost(ship_type: ShipType) -> (u64, u64) {
    match ship_type {
        ShipType::Scout => (100, 20),
        ShipType::Fighter => (200, 50),
        ShipType::Cruiser => (500, 150),
        ShipType::Battleship => (2000, 500),
        ShipType::Carrier => (3000, 1000),
        ShipType::Freighter => (400, 100),
        ShipType::Colonizer => (5000, 2000),
        ShipType::MineLay => (300, 100),
        ShipType::Destroyer => (800, 200),
        ShipType::Dreadnought => (10000, 5000),
    }
}
