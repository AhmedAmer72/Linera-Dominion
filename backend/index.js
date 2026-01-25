/**
 * Linera Dominion Backend API
 * 
 * Simple backend for leaderboards and player data persistence.
 * Uses file-based storage that can be upgraded to a database later.
 */

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration for production
const corsOptions = {
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://localhost:3001', 'https://linera-dominion.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'players.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ players: {} }, null, 2));
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

/**
 * Load player data from file
 */
function loadData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading data:', error);
    return { players: {} };
  }
}

/**
 * Save player data to file
 */
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

/**
 * Calculate player score based on their stats
 */
function calculateScore(player) {
  const buildingScore = (player.buildings?.length || 0) * 100;
  const buildingLevelScore = (player.buildings || []).reduce((sum, b) => sum + (b.level || 1) * 50, 0);
  const fleetScore = (player.fleets?.length || 0) * 200;
  const shipScore = (player.fleets || []).reduce((sum, f) => 
    sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0) * 10, 0), 0);
  const resourceScore = Math.floor(
    ((player.resources?.iron || 0) + 
     (player.resources?.deuterium || 0) * 2 + 
     (player.resources?.crystals || 0) * 5) / 100
  );
  
  return buildingScore + buildingLevelScore + fleetScore + shipScore + resourceScore;
}

// ==================== API ROUTES ====================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get player data
 */
app.get('/api/player/:address', (req, res) => {
  const { address } = req.params;
  const normalizedAddress = address.toLowerCase();
  
  const data = loadData();
  const player = data.players[normalizedAddress];
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json({
    ...player,
    score: calculateScore(player),
  });
});

/**
 * Save/Update player data
 */
app.post('/api/player/:address', (req, res) => {
  const { address } = req.params;
  const normalizedAddress = address.toLowerCase();
  const playerData = req.body;
  
  const data = loadData();
  
  // Merge with existing data or create new
  const existing = data.players[normalizedAddress] || {};
  data.players[normalizedAddress] = {
    ...existing,
    ...playerData,
    address: normalizedAddress,
    lastUpdated: Date.now(),
  };
  
  saveData(data);
  
  res.json({
    success: true,
    player: data.players[normalizedAddress],
    score: calculateScore(data.players[normalizedAddress]),
  });
});

/**
 * Get leaderboard
 */
app.get('/api/leaderboard', (req, res) => {
  const { limit = 100, sortBy = 'score' } = req.query;
  
  const data = loadData();
  
  // Convert players object to array with scores
  const players = Object.values(data.players).map(player => ({
    address: player.address,
    playerName: player.playerName || 'Unknown Commander',
    buildings: player.buildings?.length || 0,
    totalBuildingLevels: (player.buildings || []).reduce((sum, b) => sum + (b.level || 1), 0),
    fleets: player.fleets?.length || 0,
    totalShips: (player.fleets || []).reduce((sum, f) => 
      sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0),
    resources: player.resources || { iron: 0, deuterium: 0, crystals: 0 },
    score: calculateScore(player),
    lastUpdated: player.lastUpdated,
  }));
  
  // Sort by score (descending)
  players.sort((a, b) => {
    if (sortBy === 'buildings') return b.totalBuildingLevels - a.totalBuildingLevels;
    if (sortBy === 'ships') return b.totalShips - a.totalShips;
    if (sortBy === 'resources') {
      const aTotal = a.resources.iron + a.resources.deuterium + a.resources.crystals;
      const bTotal = b.resources.iron + b.resources.deuterium + b.resources.crystals;
      return bTotal - aTotal;
    }
    return b.score - a.score;
  });
  
  // Add rank
  const ranked = players.slice(0, parseInt(limit)).map((player, index) => ({
    rank: index + 1,
    ...player,
  }));
  
  res.json({
    leaderboard: ranked,
    totalPlayers: players.length,
    lastUpdated: new Date().toISOString(),
  });
});

/**
 * Get player rank
 */
app.get('/api/player/:address/rank', (req, res) => {
  const { address } = req.params;
  const normalizedAddress = address.toLowerCase();
  
  const data = loadData();
  
  // Calculate all scores and sort
  const players = Object.values(data.players).map(player => ({
    address: player.address,
    score: calculateScore(player),
  }));
  
  players.sort((a, b) => b.score - a.score);
  
  const rank = players.findIndex(p => p.address === normalizedAddress) + 1;
  
  if (rank === 0) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json({
    address: normalizedAddress,
    rank,
    totalPlayers: players.length,
    score: players.find(p => p.address === normalizedAddress)?.score || 0,
  });
});

/**
 * Delete player data (for testing)
 */
app.delete('/api/player/:address', (req, res) => {
  const { address } = req.params;
  const normalizedAddress = address.toLowerCase();
  
  const data = loadData();
  
  if (!data.players[normalizedAddress]) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  delete data.players[normalizedAddress];
  saveData(data);
  
  res.json({ success: true });
});

// ==================== GALAXY/MULTIPLAYER ROUTES ====================

/**
 * Get all players for the galaxy map
 * Returns position, power level, and basic info for each player
 */
app.get('/api/galaxy/players', (req, res) => {
  const { excludeAddress } = req.query;
  const normalizedExclude = excludeAddress?.toLowerCase();
  
  const data = loadData();
  
  // Convert players to galaxy map format
  const galaxyPlayers = Object.values(data.players)
    .filter(player => player.address !== normalizedExclude) // Exclude current player
    .map(player => {
      const score = calculateScore(player);
      const totalShips = (player.fleets || []).reduce((sum, f) => 
        sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0);
      const totalBuildingLevels = (player.buildings || []).reduce((sum, b) => sum + (b.level || 1), 0);
      
      // Calculate power level (determines difficulty to invade)
      const powerLevel = Math.floor(score / 100);
      
      return {
        address: player.address,
        playerName: player.playerName || 'Unknown Commander',
        homeX: player.homeX || Math.floor(Math.random() * 20) - 10,
        homeY: player.homeY || Math.floor(Math.random() * 20) - 10,
        score,
        powerLevel,
        totalShips,
        totalBuildingLevels,
        fleetCount: player.fleets?.length || 0,
        lastUpdated: player.lastUpdated,
      };
    })
    // Only include players who have been active in last 7 days
    .filter(p => p.lastUpdated && Date.now() - p.lastUpdated < 7 * 24 * 60 * 60 * 1000);
  
  res.json({
    players: galaxyPlayers,
    totalPlayers: galaxyPlayers.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get a specific player's invasion info
 * Used when clicking on a player in the galaxy to see if invasion is possible
 */
app.get('/api/galaxy/player/:address', (req, res) => {
  const { address } = req.params;
  const { attackerAddress } = req.query;
  const normalizedAddress = address.toLowerCase();
  const normalizedAttacker = attackerAddress?.toLowerCase();
  
  const data = loadData();
  const defender = data.players[normalizedAddress];
  const attacker = normalizedAttacker ? data.players[normalizedAttacker] : null;
  
  if (!defender) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  const defenderScore = calculateScore(defender);
  const attackerScore = attacker ? calculateScore(attacker) : 0;
  
  // Calculate total ships for both players
  const defenderShips = (defender.fleets || []).reduce((sum, f) => 
    sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0);
  const attackerShips = attacker ? (attacker.fleets || []).reduce((sum, f) => 
    sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0) : 0;
  
  // Calculate minimum ships needed to invade (25% of defender's ships + 2) - lowered for testing
  const minShipsRequired = Math.floor(defenderShips * 0.25) + 2;
  
  // Check if attacker meets requirements
  const canInvade = attacker && attackerShips >= minShipsRequired;
  
  res.json({
    defender: {
      address: defender.address,
      playerName: defender.playerName || 'Unknown Commander',
      homeX: defender.homeX,
      homeY: defender.homeY,
      score: defenderScore,
      totalShips: defenderShips,
      totalBuildingLevels: (defender.buildings || []).reduce((sum, b) => sum + (b.level || 1), 0),
      resources: defender.resources,
      lastUpdated: defender.lastUpdated,
    },
    invasion: {
      minShipsRequired,
      attackerShips,
      canInvade,
      estimatedLootRatio: Math.min(0.5, attackerShips / (defenderShips || 1) * 0.25), // Max 50% loot
    },
  });
});

/**
 * Execute an invasion attempt
 */
app.post('/api/galaxy/invade', (req, res) => {
  const { attackerAddress, defenderAddress, fleetId } = req.body;
  
  if (!attackerAddress || !defenderAddress) {
    return res.status(400).json({ error: 'Missing attacker or defender address' });
  }
  
  const normalizedAttacker = attackerAddress.toLowerCase();
  const normalizedDefender = defenderAddress.toLowerCase();
  
  const data = loadData();
  const attacker = data.players[normalizedAttacker];
  const defender = data.players[normalizedDefender];
  
  if (!attacker) {
    return res.status(404).json({ error: 'Attacker not found' });
  }
  if (!defender) {
    return res.status(404).json({ error: 'Defender not found' });
  }
  
  // Calculate ships
  const attackerShips = (attacker.fleets || []).reduce((sum, f) => 
    sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0);
  const defenderShips = (defender.fleets || []).reduce((sum, f) => 
    sum + (f.ships || []).reduce((s, ship) => s + (ship.quantity || 0), 0), 0);
  
  // Lowered requirements for testing: 25% of defender + 2 minimum
  const minShipsRequired = Math.floor(defenderShips * 0.25) + 2;
  
  if (attackerShips < minShipsRequired) {
    return res.status(400).json({ 
      error: 'Not enough ships', 
      required: minShipsRequired, 
      have: attackerShips 
    });
  }
  
  // Simulate battle
  // Attacker needs to overcome defender's ships
  // Victory ratio determines loot and losses
  const powerRatio = attackerShips / (defenderShips || 1);
  const victoryChance = Math.min(0.9, powerRatio * 0.4);
  const victory = Math.random() < victoryChance;
  
  // Calculate losses (both sides lose ships)
  const attackerLossRatio = victory ? 0.1 + Math.random() * 0.2 : 0.3 + Math.random() * 0.4;
  const defenderLossRatio = victory ? 0.3 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2;
  
  // Apply losses to attacker's fleets
  let attackerShipsLost = 0;
  if (attacker.fleets) {
    for (const fleet of attacker.fleets) {
      if (fleet.ships) {
        for (const ship of fleet.ships) {
          const losses = Math.floor(ship.quantity * attackerLossRatio);
          attackerShipsLost += losses;
          ship.quantity = Math.max(0, ship.quantity - losses);
        }
      }
    }
  }
  
  // Apply losses to defender's fleets
  let defenderShipsLost = 0;
  if (defender.fleets) {
    for (const fleet of defender.fleets) {
      if (fleet.ships) {
        for (const ship of fleet.ships) {
          const losses = Math.floor(ship.quantity * defenderLossRatio);
          defenderShipsLost += losses;
          ship.quantity = Math.max(0, ship.quantity - losses);
        }
      }
    }
  }
  
  // Calculate loot if victory
  let loot = { iron: 0, deuterium: 0, crystals: 0 };
  if (victory && defender.resources) {
    const lootRatio = Math.min(0.5, powerRatio * 0.25);
    loot = {
      iron: Math.floor((defender.resources.iron || 0) * lootRatio),
      deuterium: Math.floor((defender.resources.deuterium || 0) * lootRatio),
      crystals: Math.floor((defender.resources.crystals || 0) * lootRatio),
    };
    
    // Transfer resources
    defender.resources.iron = Math.max(0, defender.resources.iron - loot.iron);
    defender.resources.deuterium = Math.max(0, defender.resources.deuterium - loot.deuterium);
    defender.resources.crystals = Math.max(0, defender.resources.crystals - loot.crystals);
    
    attacker.resources = attacker.resources || { iron: 0, deuterium: 0, crystals: 0 };
    attacker.resources.iron = (attacker.resources.iron || 0) + loot.iron;
    attacker.resources.deuterium = (attacker.resources.deuterium || 0) + loot.deuterium;
    attacker.resources.crystals = (attacker.resources.crystals || 0) + loot.crystals;
  }
  
  // Save updated data
  data.players[normalizedAttacker] = { ...attacker, lastUpdated: Date.now() };
  data.players[normalizedDefender] = { ...defender, lastUpdated: Date.now() };
  saveData(data);
  
  res.json({
    success: true,
    victory,
    battle: {
      attackerShipsLost,
      defenderShipsLost,
      powerRatio: powerRatio.toFixed(2),
    },
    loot: victory ? loot : null,
    message: victory 
      ? `Victory! You captured ${loot.iron} iron, ${loot.deuterium} deuterium, and ${loot.crystals} crystals!`
      : `Defeat! Your fleet was repelled. You lost ${attackerShipsLost} ships.`,
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Linera Dominion API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`❤️  Health: /api/health`);
});
