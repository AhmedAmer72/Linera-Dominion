//! Region Contract - Region Chain smart contract

#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::{
    linera_base_types::WithContractAbi,
    Contract, ContractRuntime,
    views::{RootView, View},
};
use linera_dominion_region::{
    RegionAbi, RegionError, RegionParameters,
    Operation, Message,
};
use linera_dominion_region::state::{RegionState, FleetPresenceData, BattleRef};

pub struct RegionContract {
    state: RegionState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(RegionContract);

impl WithContractAbi for RegionContract {
    type Abi = RegionAbi;
}

impl Contract for RegionContract {
    type Message = Message;
    type Parameters = RegionParameters;
    type InstantiationArgument = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = RegionState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        Self { state, runtime }
    }

    async fn instantiate(&mut self, _argument: Self::InstantiationArgument) {
        let params = self.runtime.application_parameters();
        self.state.initialize(
            params.sector_x,
            params.sector_y,
            params.universe_seed,
        );
    }

    async fn execute_operation(&mut self, operation: Self::Operation) -> Result<(), RegionError> {
        let now = self.runtime.system_time();
        let now_micros = now.micros();
        
        match operation {
            Operation::ClaimPlanet { planet_id, stake } => {
                if let Some(mut planet) = self.state.planets.get(&planet_id).await
                    .map_err(|_| RegionError::PlanetNotFound(planet_id))? {
                    if !planet.owner_chain.is_empty() {
                        return Err(RegionError::PlanetAlreadyClaimed);
                    }
                    planet.owner_chain = String::new();
                    planet.stake_iron = stake.iron;
                    planet.stake_deuterium = stake.deuterium;
                    planet.stake_crystals = stake.crystals;
                    planet.stake_updated_micros = now_micros;
                    self.state.planets.insert(&planet_id, planet)
                        .map_err(|_| RegionError::NotAuthorized)?;
                }
                Ok(())
            }
            
            Operation::ResupplyPlanet { planet_id, additional_stake } => {
                if let Some(mut planet) = self.state.planets.get(&planet_id).await
                    .map_err(|_| RegionError::PlanetNotFound(planet_id))? {
                    planet.stake_iron += additional_stake.iron;
                    planet.stake_deuterium += additional_stake.deuterium;
                    planet.stake_crystals += additional_stake.crystals;
                    planet.stake_updated_micros = now_micros;
                    self.state.planets.insert(&planet_id, planet)
                        .map_err(|_| RegionError::NotAuthorized)?;
                }
                Ok(())
            }
            
            Operation::AbandonPlanet { planet_id } => {
                if let Some(mut planet) = self.state.planets.get(&planet_id).await
                    .map_err(|_| RegionError::PlanetNotFound(planet_id))? {
                    planet.owner_chain = String::new();
                    planet.stake_iron = 0;
                    planet.stake_deuterium = 0;
                    planet.stake_crystals = 0;
                    self.state.planets.insert(&planet_id, planet)
                        .map_err(|_| RegionError::NotAuthorized)?;
                }
                Ok(())
            }
            
            Operation::ScanFleet { target_fleet_id, scanner_fleet_id: _ } => {
                let count = *self.state.fleet_count.get();
                for i in 0..count {
                    if let Ok(Some(mut f)) = self.state.fleets.get(&i).await {
                        if f.fleet_id == target_fleet_id {
                            f.revealed = true;
                            let _ = self.state.fleets.insert(&i, f);
                            return Ok(());
                        }
                    }
                }
                Err(RegionError::FleetNotFound(target_fleet_id))
            }
            
            Operation::DeclareHostility { attacker_fleet_id, target_fleet_id } => {
                let count = *self.state.battle_count.get();
                let battle_ref = BattleRef {
                    battle_id: count,
                    battle_chain: String::new(),
                    x: 0,
                    y: 0,
                    started_at_micros: now_micros,
                };
                self.state.battles.insert(&count, battle_ref)
                    .map_err(|_| RegionError::NotAuthorized)?;
                self.state.battle_count.set(count + 1);
                Ok(())
            }
            
            Operation::CollectDebris { fleet_id, debris_id } => {
                let mut fleet_found = false;
                let count = *self.state.fleet_count.get();
                for i in 0..count {
                    if let Ok(Some(f)) = self.state.fleets.get(&i).await {
                        if f.fleet_id == fleet_id {
                            fleet_found = true;
                            break;
                        }
                    }
                }
                if !fleet_found {
                    return Err(RegionError::FleetNotInSector);
                }
                
                self.state.debris.remove(&debris_id)
                    .map_err(|_| RegionError::NotAuthorized)?;
                Ok(())
            }
            
            Operation::ProcessStakeDecay => {
                Ok(())
            }
        }
    }

    async fn execute_message(&mut self, message: Self::Message) {
        let now = self.runtime.system_time();
        let now_micros = now.micros();
        
        match message {
            Message::FleetEnter { fleet_id, owner: _, owner_chain: _, x, y, commitment_hash } => {
                let count = *self.state.fleet_count.get();
                let presence = FleetPresenceData {
                    fleet_id,
                    owner_chain: String::new(),
                    position_x: x,
                    position_y: y,
                    commitment_hash,
                    arrived_at_micros: now_micros,
                    revealed: false,
                };
                let _ = self.state.fleets.insert(&count, presence);
                self.state.fleet_count.set(count + 1);
            }
            
            Message::FleetLeave { fleet_id } => {
                let count = *self.state.fleet_count.get();
                for i in 0..count {
                    if let Ok(Some(f)) = self.state.fleets.get(&i).await {
                        if f.fleet_id == fleet_id {
                            let _ = self.state.fleets.remove(&i);
                            break;
                        }
                    }
                }
            }
            
            Message::FleetReveal { fleet_id, ship_counts: _, salt: _ } => {
                let count = *self.state.fleet_count.get();
                for i in 0..count {
                    if let Ok(Some(mut f)) = self.state.fleets.get(&i).await {
                        if f.fleet_id == fleet_id {
                            f.revealed = true;
                            let _ = self.state.fleets.insert(&i, f);
                            break;
                        }
                    }
                }
            }
            
            Message::BattleResolved { battle_id, .. } => {
                // Battle completed - no resolved field in BattleRef
            }
            
            _ => {}
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}
