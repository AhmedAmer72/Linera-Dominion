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
app.use(cors());
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Linera Dominion API running on port ${PORT}`);
  console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
});
