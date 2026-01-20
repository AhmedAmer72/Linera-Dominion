//! Battle Service - GraphQL query service for Battle Chain

#![cfg_attr(target_arch = "wasm32", no_main)]

use async_graphql::{Object, Request, Response};
use linera_sdk::{
    linera_base_types::WithServiceAbi,
    Service, ServiceRuntime,
    views::View,
};
use linera_dominion_battle::BattleAbi;
use linera_dominion_battle::state::BattleState;

pub struct BattleService {
    state: BattleState,
    runtime: ServiceRuntime<Self>,
}

linera_sdk::service!(BattleService);

impl WithServiceAbi for BattleService {
    type Abi = BattleAbi;
}

impl Service for BattleService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = BattleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let battle_id = *self.state.battle_id.get();
        let region_chain = self.state.region_chain.get().clone();
        let position_x = *self.state.position_x.get();
        let position_y = *self.state.position_y.get();
        let current_turn = *self.state.current_turn.get();
        let max_turns = *self.state.max_turns.get();
        let is_active = *self.state.is_active.get();
        let start_time_micros = *self.state.start_time_micros.get();
        let combatant_count = *self.state.combatant_count.get();
        
        let schema = async_graphql::Schema::build(
            QueryRoot {
                battle_id,
                region_chain,
                position_x,
                position_y,
                current_turn,
                max_turns,
                is_active,
                start_time_micros,
                combatant_count,
            },
            async_graphql::EmptyMutation,
            async_graphql::EmptySubscription,
        )
        .finish();
        schema.execute(request).await
    }
}

struct QueryRoot {
    battle_id: u64,
    region_chain: String,
    position_x: i64,
    position_y: i64,
    current_turn: u32,
    max_turns: u32,
    is_active: bool,
    start_time_micros: u64,
    combatant_count: u64,
}

#[Object]
impl QueryRoot {
    async fn battle_id(&self) -> u64 {
        self.battle_id
    }

    async fn region_chain(&self) -> &str {
        &self.region_chain
    }

    async fn position_x(&self) -> i64 {
        self.position_x
    }

    async fn position_y(&self) -> i64 {
        self.position_y
    }

    async fn current_turn(&self) -> u32 {
        self.current_turn
    }

    async fn max_turns(&self) -> u32 {
        self.max_turns
    }

    async fn is_active(&self) -> bool {
        self.is_active
    }

    async fn start_time_micros(&self) -> u64 {
        self.start_time_micros
    }

    async fn combatant_count(&self) -> u64 {
        self.combatant_count
    }
}
