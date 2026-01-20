//! Operation handlers for the Dominion contract

use linera_sdk::linera_base_types::{ChainId, Timestamp};
use linera_dominion_common::{
    resources::Resources,
    types::{Building, BuildingType, Technology, FleetId, FleetState},
    units::{ShipType, Ship, ShipConstructionOrder},
    coordinates::{Coordinate, SectorCoordinate, FlightPath},
    constants::*,
};

use crate::state::{DominionState, calculate_building_cost, calculate_building_time};
use crate::{DominionOperation, DominionResponse};

/// Execute a building operation
pub async fn handle_build(
    state: &mut DominionState,
    building_type: BuildingType,
    coordinate: Coordinate,
    now: Timestamp,
) -> DominionResponse {
    // Check if building exists at coordinate
    let key = (coordinate.x, coordinate.y);
    
    match state.buildings.get(&key).await {
        Ok(Some(existing)) => {
            // Upgrade existing building
            if existing.building_type != building_type {
                return DominionResponse::Error(
                    "Cannot change building type. Demolish first.".to_string()
                );
            }
            
            match state.upgrade_building(&coordinate, now).await {
                Ok(()) => DominionResponse::Ok,
                Err(e) => DominionResponse::Error(e),
            }
        }
        Ok(None) => {
            // Build new building
            let cost = calculate_building_cost(building_type, 1);
            
            if let Err(e) = state.debit_resources(&cost, now).await {
                return DominionResponse::Error(e);
            }
            
            let build_time = calculate_building_time(building_type, 1);
            let next_id = *state.next_building_id.get();
            
            let building = Building {
                id: next_id,
                building_type,
                level: 0, // Will become 1 when construction completes
                coordinate,
                construction_end: Some(Timestamp::from(
                    now.micros() + build_time * 1_000_000
                )),
            };
            
            match state.add_building(building).await {
                Ok(()) => DominionResponse::Ok,
                Err(e) => DominionResponse::Error(e),
            }
        }
        Err(e) => DominionResponse::Error(e.to_string()),
    }
}

/// Execute research operation
pub async fn handle_research(
    state: &mut DominionState,
    technology: Technology,
    now: Timestamp,
) -> DominionResponse {
    let mut research = state.research.get().clone();
    
    // Check if already researching
    if research.current_research.is_some() {
        return DominionResponse::Error("Research already in progress".to_string());
    }
    
    let current_level = research.get_level(technology);
    let next_level = current_level + 1;
    
    // Calculate research cost
    let cost = calculate_research_cost(technology, next_level);
    
    if let Err(e) = state.debit_resources(&cost, now).await {
        return DominionResponse::Error(e);
    }
    
    // Calculate research time
    let research_time = calculate_research_time(technology, next_level);
    let completes_at = Timestamp::from(now.micros() + research_time * 1_000_000);
    
    research.current_research = Some((technology, completes_at));
    state.research.set(research);
    
    DominionResponse::Ok
}

/// Execute ship building operation
pub async fn handle_build_ships(
    state: &mut DominionState,
    ship_type: ShipType,
    quantity: u32,
    owner: linera_sdk::linera_base_types::AccountOwner,
    now: Timestamp,
) -> DominionResponse {
    // Check shipyard capacity
    let shipyard_level = get_shipyard_level(state).await;
    if shipyard_level == 0 {
        return DominionResponse::Error("No shipyard available".to_string());
    }
    
    let capacity = shipyard_level * SHIPS_PER_SHIPYARD_LEVEL;
    if quantity > capacity {
        return DominionResponse::Error(format!(
            "Exceeds shipyard capacity: {} max, {} requested",
            capacity, quantity
        ));
    }
    
    // Calculate total cost
    let unit_cost = ship_type.construction_cost();
    let total_cost = Resources::new(
        unit_cost.iron * quantity as u128,
        unit_cost.deuterium * quantity as u128,
        unit_cost.chronos_crystals * quantity as u128,
    );
    
    if let Err(e) = state.debit_resources(&total_cost, now).await {
        return DominionResponse::Error(e);
    }
    
    // Add to construction queue
    let build_time = ship_type.construction_time() * quantity as u64;
    let order = ShipConstructionOrder {
        ship_type,
        quantity,
        started_at: now,
        completes_at: Timestamp::from(now.micros() + build_time * 1_000_000),
    };
    
    state.ship_queue.push(order);
    
    DominionResponse::Ok
}

/// Create a new fleet
pub async fn handle_create_fleet(
    state: &mut DominionState,
    ships: Vec<(ShipType, u32)>,
    owner: linera_sdk::linera_base_types::AccountOwner,
    owner_chain: ChainId,
    now: Timestamp,
) -> DominionResponse {
    // Validate ship count
    let total_ships: u32 = ships.iter().map(|(_, count)| count).sum();
    if total_ships > MAX_SHIPS_PER_FLEET as u32 {
        return DominionResponse::Error(format!(
            "Fleet exceeds maximum size: {} max, {} requested",
            MAX_SHIPS_PER_FLEET, total_ships
        ));
    }
    
    match state.create_fleet(owner, owner_chain, ships, now).await {
        Ok(fleet_id) => DominionResponse::FleetCreated(fleet_id),
        Err(e) => DominionResponse::Error(e),
    }
}

/// Send a fleet to a destination
pub async fn handle_send_fleet(
    state: &mut DominionState,
    fleet_id: FleetId,
    destination: Coordinate,
    cargo: Option<Resources>,
    now: Timestamp,
) -> DominionResponse {
    let fleet = match state.get_fleet(fleet_id).await {
        Ok(Some(f)) => f,
        Ok(None) => return DominionResponse::Error("Fleet not found".to_string()),
        Err(e) => return DominionResponse::Error(e),
    };
    
    // Check fleet is idle
    if fleet.state != FleetState::Idle {
        return DominionResponse::Error("Fleet is not idle".to_string());
    }
    
    // Calculate journey
    let path = FlightPath::direct(
        fleet.position,
        destination,
        fleet.speed(),
        fleet.fuel_consumption(),
        SECTOR_SIZE,
    );
    
    // Check fuel
    let fuel_available = state.get_current_resources(now).await.deuterium;
    if path.fuel_required > fuel_available {
        return DominionResponse::Error(format!(
            "Insufficient fuel: need {}, have {}",
            path.fuel_required, fuel_available
        ));
    }
    
    // Debit fuel
    let fuel_cost = Resources::new(0, path.fuel_required, 0);
    if let Err(e) = state.debit_resources(&fuel_cost, now).await {
        return DominionResponse::Error(e);
    }
    
    // Load cargo if specified
    let mut updated_fleet = fleet.clone();
    if let Some(cargo_load) = cargo {
        if cargo_load.total_value() > updated_fleet.cargo_capacity() as u128 {
            return DominionResponse::Error("Cargo exceeds fleet capacity".to_string());
        }
        
        if let Err(e) = state.debit_resources(&cargo_load, now).await {
            return DominionResponse::Error(e);
        }
        
        updated_fleet.cargo = cargo_load;
    }
    
    // Update fleet state
    let arrival_time = Timestamp::from(now.micros() + path.estimated_time * 1_000_000);
    updated_fleet.state = FleetState::Moving {
        destination,
        arrival_time,
    };
    updated_fleet.last_update = now;
    
    if let Err(e) = state.update_fleet(updated_fleet).await {
        return DominionResponse::Error(e);
    }
    
    // Note: In production, we'd send a cross-chain message to the destination Region Chain
    // using runtime.prepare_message(...).send_to(destination_chain)
    
    DominionResponse::Ok
}

/// Transfer resources to another chain
pub async fn handle_transfer_resources(
    state: &mut DominionState,
    resources: Resources,
    now: Timestamp,
) -> DominionResponse {
    if let Err(e) = state.debit_resources(&resources, now).await {
        return DominionResponse::Error(e);
    }
    
    // Note: In production, we'd send a cross-chain message with the resources
    // The actual transfer message would be sent in the contract
    
    DominionResponse::Ok
}

// ========== Helper Functions ==========

fn calculate_research_cost(technology: Technology, level: u32) -> Resources {
    let base = match technology {
        Technology::AdvancedMining => Resources::new(500, 200, 10),
        Technology::ReinforcedHulls => Resources::new(1000, 500, 20),
        Technology::PlasmaWeapons => Resources::new(2000, 1000, 50),
        Technology::IonDrives => Resources::new(1500, 800, 30),
        Technology::WarpTechnology => Resources::new(5000, 3000, 200),
        Technology::ShieldHarmonics => Resources::new(2500, 1500, 100),
        Technology::NanoConstruction => Resources::new(3000, 2000, 150),
        Technology::ExpandedCargoBays => Resources::new(800, 400, 10),
        Technology::LongRangeSensors => Resources::new(1200, 600, 25),
        Technology::StealthSystems => Resources::new(4000, 2500, 300),
        Technology::TemporalMechanics => Resources::new(10000, 8000, 1000),
    };
    
    // Scale with level
    Resources::new(
        base.iron * level as u128,
        base.deuterium * level as u128,
        base.chronos_crystals * level as u128,
    )
}

fn calculate_research_time(technology: Technology, level: u32) -> u64 {
    let base_hours: u64 = match technology {
        Technology::AdvancedMining => 1,
        Technology::ReinforcedHulls => 2,
        Technology::PlasmaWeapons => 4,
        Technology::IonDrives => 3,
        Technology::WarpTechnology => 12,
        Technology::ShieldHarmonics => 6,
        Technology::NanoConstruction => 8,
        Technology::ExpandedCargoBays => 1,
        Technology::LongRangeSensors => 2,
        Technology::StealthSystems => 10,
        Technology::TemporalMechanics => 24,
    };
    
    base_hours * level as u64 * RESEARCH_TIME_MULTIPLIER
}

async fn get_shipyard_level(state: &DominionState) -> u32 {
    // In production, we'd iterate through buildings to find shipyard
    // For now, return a default value
    1
}
