//! Region Service - GraphQL query service for Region Chain

#![cfg_attr(target_arch = "wasm32", no_main)]

use async_graphql::{Object, Request, Response};
use linera_sdk::{
    linera_base_types::WithServiceAbi,
    Service, ServiceRuntime,
    views::View,
};
use linera_dominion_region::RegionAbi;
use linera_dominion_region::state::RegionState;

pub struct RegionService {
    state: RegionState,
    runtime: ServiceRuntime<Self>,
}

linera_sdk::service!(RegionService);

impl WithServiceAbi for RegionService {
    type Abi = RegionAbi;
}

impl Service for RegionService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = RegionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let sector_x = *self.state.sector_x.get();
        let sector_y = *self.state.sector_y.get();
        let universe_seed = *self.state.universe_seed.get();
        let fleet_count = *self.state.fleet_count.get();
        let planet_count = *self.state.planet_count.get();
        let debris_count = *self.state.debris_count.get();
        let battle_count = *self.state.battle_count.get();
        let is_subdivided = *self.state.is_subdivided.get();
        
        let schema = async_graphql::Schema::build(
            QueryRoot {
                sector_x,
                sector_y,
                universe_seed,
                fleet_count,
                planet_count,
                debris_count,
                battle_count,
                is_subdivided,
            },
            async_graphql::EmptyMutation,
            async_graphql::EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    sector_x: i64,
    sector_y: i64,
    universe_seed: u64,
    fleet_count: u64,
    planet_count: u64,
    debris_count: u64,
    battle_count: u64,
    is_subdivided: bool,
}

#[Object]
impl QueryRoot {
    async fn sector_x(&self) -> i64 {
        self.sector_x
    }

    async fn sector_y(&self) -> i64 {
        self.sector_y
    }

    async fn universe_seed(&self) -> u64 {
        self.universe_seed
    }

    async fn fleet_count(&self) -> u64 {
        self.fleet_count
    }

    async fn planet_count(&self) -> u64 {
        self.planet_count
    }

    async fn debris_count(&self) -> u64 {
        self.debris_count
    }

    async fn battle_count(&self) -> u64 {
        self.battle_count
    }

    async fn is_subdivided(&self) -> bool {
        self.is_subdivided
    }
}
