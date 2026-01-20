//! Battle Contract - Ephemeral combat resolution

#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::WithContractAbi,
    Contract, ContractRuntime,
    views::{RootView, View},
};
use linera_dominion_battle::{
    BattleState, BattleAbi, BattleError, BattleParameters, BattleInstantiationArg,
    Operation, Message,
    state::CombatantData,
};

pub struct BattleContract {
    state: BattleState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(BattleContract);

impl WithContractAbi for BattleContract {
    type Abi = BattleAbi;
}

impl Contract for BattleContract {
    type Message = Message;
    type Parameters = BattleParameters;
    type InstantiationArgument = BattleInstantiationArg;
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = BattleState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn instantiate(&mut self, arg: Self::InstantiationArgument) {
        let params = self.runtime.application_parameters();
        let now = self.runtime.system_time();
        
        self.state.initialize(
            params.max_turns,
            params.turn_duration_micros,
            now.micros(),
        );
        
        // Set up attacker (combatant id 0)
        let attacker = CombatantData {
            owner_chain: arg.attacker_chain.to_string(),
            ships: arg.attacker_ships.clone(),
            remaining_ships: arg.attacker_ships.clone(),
            bonded_iron: 0,
            bonded_deuterium: 0,
            bonded_crystals: 0,
            is_defender: false,
            has_retreated: false,
        };
        
        // Set up defender (combatant id 1)
        let defender = CombatantData {
            owner_chain: arg.defender_chain.to_string(),
            ships: arg.defender_ships.clone(),
            remaining_ships: arg.defender_ships.clone(),
            bonded_iron: 0,
            bonded_deuterium: 0,
            bonded_crystals: 0,
            is_defender: true,
            has_retreated: false,
        };
        
        self.state.combatants.insert(&0, attacker).expect("insert attacker");
        self.state.combatants.insert(&1, defender).expect("insert defender");
        self.state.combatant_count.set(2);
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Result<(), BattleError> {
        let now = self.runtime.system_time();
        let now_micros = now.micros();
        
        let is_active = *self.state.is_active.get();
        if !is_active {
            return Err(BattleError::BattleNotActive);
        }
        
        match operation {
            Operation::SubmitCommand { fleet_id: _, command: _, target_priority: _ } => {
                Ok(())
            }
            
            Operation::RequestResolution => {
                self.process_turn(now_micros);
                Ok(())
            }
            
            Operation::ForceTimeout => {
                let start_time = *self.state.start_time_micros.get();
                let turn_duration = *self.state.turn_duration_micros.get();
                let current_turn = *self.state.current_turn.get();
                
                let expected_time = start_time + (current_turn as u64 + 1) * turn_duration;
                
                if now_micros < expected_time {
                    return Err(BattleError::TimeoutNotReached);
                }
                
                self.state.is_active.set(false);
                Ok(())
            }
            
            Operation::ExtendWarBond { additional: _ } => {
                Ok(())
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        match message {
            Message::InitializeBattle { .. } => {}
            Message::SubmitCommand { fleet_id: _, command: _ } => {}
            Message::RequestResolution => {}
            Message::ForceTimeout => {
                self.state.is_active.set(false);
            }
            Message::BattleResult { .. } => {}
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl BattleContract {
    fn process_turn(&mut self, _now_micros: u64) {
        let current_turn = *self.state.current_turn.get();
        let max_turns = *self.state.max_turns.get();
        
        self.state.current_turn.set(current_turn + 1);
        
        if current_turn + 1 >= max_turns {
            self.state.is_active.set(false);
        }
    }
}
