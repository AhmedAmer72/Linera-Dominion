//! Dominion Service - GraphQL query service for User Chain

#![cfg_attr(target_arch = "wasm32", no_main)]

use std::sync::Arc;
use async_graphql::{Object, Request, Response, Schema, EmptySubscription};
use linera_sdk::{
    linera_base_types::WithServiceAbi,
    Service, ServiceRuntime,
    views::View,
};
use linera_dominion::{
    DominionAbi, Operation, BuildingType, ShipType, Technology,
};
use linera_dominion::state::DominionState;

pub struct DominionService {
    state: DominionState,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(DominionService);

impl WithServiceAbi for DominionService {
    type Abi = DominionAbi;
}

impl Service for DominionService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = DominionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { 
            state, 
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        // Get values we need for the query - use getter methods
        let name = self.state.name().get().clone();
        let home_x = *self.state.home_x().get();
        let home_y = *self.state.home_y().get();
        let wallet = self.state.wallet().get().clone();
        let building_count = *self.state.building_count().get();
        let fleet_count = *self.state.fleet_count().get();
        
        let query_root = QueryRoot {
            name,
            home_x,
            home_y,
            iron: wallet.iron,
            deuterium: wallet.deuterium,
            crystals: wallet.crystals,
            building_count,
            fleet_count,
        };
        
        let mutation_root = MutationRoot {
            runtime: self.runtime.clone(),
        };
        
        let schema = Schema::build(query_root, mutation_root, EmptySubscription)
            .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    name: String,
    home_x: i64,
    home_y: i64,
    iron: u64,
    deuterium: u64,
    crystals: u64,
    building_count: u64,
    fleet_count: u64,
}

#[Object]
impl QueryRoot {
    async fn name(&self) -> &str {
        &self.name
    }

    async fn home_x(&self) -> i64 {
        self.home_x
    }

    async fn home_y(&self) -> i64 {
        self.home_y
    }

    async fn iron(&self) -> u64 {
        self.iron
    }

    async fn deuterium(&self) -> u64 {
        self.deuterium
    }

    async fn crystals(&self) -> u64 {
        self.crystals
    }

    async fn building_count(&self) -> u64 {
        self.building_count
    }

    async fn fleet_count(&self) -> u64 {
        self.fleet_count
    }
}

// ==================== MUTATIONS ====================

struct MutationRoot {
    runtime: Arc<ServiceRuntime<DominionService>>,
}

#[Object]
impl MutationRoot {
    /// Build a structure at coordinates
    async fn build(&self, building_type: BuildingType, x: i64, y: i64) -> Vec<u8> {
        let operation = Operation::Build { building_type, x, y };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Build ships
    async fn build_ships(&self, ship_type: ShipType, quantity: u32) -> Vec<u8> {
        let operation = Operation::BuildShips { ship_type, quantity };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Start research
    async fn research(&self, technology: Technology) -> Vec<u8> {
        let operation = Operation::Research { technology };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Cancel construction
    async fn cancel_construction(&self, building_id: u64) -> Vec<u8> {
        let operation = Operation::CancelConstruction { building_id };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Cancel research
    async fn cancel_research(&self) -> Vec<u8> {
        let operation = Operation::CancelResearch;
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Send fleet to destination
    async fn send_fleet(
        &self, 
        fleet_id: u64, 
        destination_x: i64, 
        destination_y: i64
    ) -> Vec<u8> {
        let operation = Operation::SendFleet { 
            fleet_id, 
            destination_x, 
            destination_y,
            cargo: None,
        };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
    
    /// Recall fleet
    async fn recall_fleet(&self, fleet_id: u64) -> Vec<u8> {
        let operation = Operation::RecallFleet { fleet_id };
        self.runtime.schedule_operation(&operation);
        vec![]
    }
}
