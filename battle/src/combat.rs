//! Combat calculation module

use crate::state::CombatantData;

/// Ship attack power by type (index = ship_type)
const SHIP_ATTACK: [u64; 10] = [5, 15, 50, 150, 100, 5, 1, 20, 80, 300];

/// Ship defense power by type (index = ship_type)  
const SHIP_DEFENSE: [u64; 10] = [2, 10, 30, 100, 150, 10, 5, 15, 50, 200];

/// Calculate damage for a combat round
pub fn calculate_damage(attacker: &CombatantData, defender: &CombatantData) -> (u64, u64) {
    // Calculate base attack power from ships
    let attacker_base: u64 = attacker.ships.iter().enumerate().map(|(i, &c)| {
        let attack = SHIP_ATTACK.get(i).copied().unwrap_or(10);
        c as u64 * attack
    }).sum();
    
    let defender_base: u64 = defender.ships.iter().enumerate().map(|(i, &c)| {
        let attack = SHIP_ATTACK.get(i).copied().unwrap_or(10);
        c as u64 * attack
    }).sum();
    
    // Calculate defense
    let attacker_defense: u64 = attacker.ships.iter().enumerate().map(|(i, &c)| {
        let defense = SHIP_DEFENSE.get(i).copied().unwrap_or(5);
        c as u64 * defense
    }).sum();
    
    let defender_defense: u64 = defender.ships.iter().enumerate().map(|(i, &c)| {
        let defense = SHIP_DEFENSE.get(i).copied().unwrap_or(5);
        c as u64 * defense
    }).sum();
    
    // Calculate net damage (attack - defense, minimum 0)
    let attacker_damage = attacker_base.saturating_sub(defender_defense / 2);
    let defender_damage = defender_base.saturating_sub(attacker_defense / 2);
    
    (attacker_damage, defender_damage)
}

/// Calculate ship losses based on damage
pub fn calculate_losses(combatant: &CombatantData, damage: u64) -> Vec<u32> {
    let mut losses = vec![0u32; combatant.ships.len()];
    let mut remaining_damage = damage;
    
    // Apply damage to ships (starting from weakest)
    for (i, &count) in combatant.ships.iter().enumerate() {
        if count == 0 || remaining_damage == 0 {
            continue;
        }
        
        let hp_per_ship = SHIP_DEFENSE.get(i).copied().unwrap_or(10) * 10;
        let ships_lost = (remaining_damage / hp_per_ship).min(count as u64) as u32;
        
        losses[i] = ships_lost;
        remaining_damage = remaining_damage.saturating_sub(ships_lost as u64 * hp_per_ship);
    }
    
    losses
}

/// Apply losses to combatant
pub fn apply_losses(combatant: &mut CombatantData, losses: &[u32]) {
    for (i, &lost) in losses.iter().enumerate() {
        if i < combatant.remaining_ships.len() {
            combatant.remaining_ships[i] = combatant.remaining_ships[i].saturating_sub(lost);
        }
    }
}

/// Check if combatant is defeated (no remaining ships)
pub fn is_defeated(combatant: &CombatantData) -> bool {
    combatant.remaining_ships.iter().all(|&c| c == 0)
}

/// Calculate total ship count
pub fn total_ships(combatant: &CombatantData) -> u32 {
    combatant.remaining_ships.iter().sum()
}
