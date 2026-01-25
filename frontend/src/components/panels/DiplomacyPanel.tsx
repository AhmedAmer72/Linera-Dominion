'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect, useCallback } from 'react';
import { getGalaxyPlayers, executeInvasion, GalaxyPlayer } from '@/lib/leaderboardApi';
import { lineraAdapter } from '@/lib/linera';
import { useLinera } from '@/lib/linera/LineraProvider';
import { LAUNCH_INVASION } from '@/lib/linera/queries';

interface AllianceProposal {
  id: number;
  fromAddress: string;
  fromName: string;
  allianceName: string;
  createdAt: number;
}

export function DiplomacyPanel() {
  const { web3Address, fleets, addResources } = useGameStore();
  const [tab, setTab] = useState<'relations' | 'proposals' | 'wars'>('relations');
  const [galaxyPlayers, setGalaxyPlayers] = useState<GalaxyPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<GalaxyPlayer | null>(null);
  const [actionModal, setActionModal] = useState<'alliance' | 'war' | 'invasion' | null>(null);
  const [allianceName, setAllianceName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Mock proposals (in production, fetch from contract)
  const [proposals] = useState<AllianceProposal[]>([]);
  
  // Calculate my total ships
  const myTotalShips = fleets.reduce((sum, fleet) => 
    sum + fleet.ships.reduce((s, ship) => s + ship.quantity, 0), 0);

  // Fetch other players
  const fetchPlayers = useCallback(async () => {
    if (!web3Address) return;
    setLoading(true);
    try {
      const result = await getGalaxyPlayers(web3Address);
      if (result) {
        setGalaxyPlayers(result.players);
      }
    } catch (e) {
      console.warn('Could not fetch players');
    }
    setLoading(false);
  }, [web3Address]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Handle propose alliance (contract call)
  const handleProposeAlliance = async () => {
    if (!selectedPlayer || !allianceName.trim()) return;
    
    setActionLoading(true);
    try {
      const mutation = `
        mutation ProposeAlliance($targetChain: String!, $allianceName: String!) {
          proposeAlliance(targetChain: $targetChain, allianceName: $allianceName)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        targetChain: selectedPlayer.address,
        allianceName: allianceName.trim(),
      });
      
      setActionResult({ success: true, message: `Alliance proposal sent to ${selectedPlayer.playerName}!` });
    } catch (e) {
      setActionResult({ success: false, message: `Failed to send proposal: ${e}` });
    }
    setActionLoading(false);
  };

  // Handle declare war (contract call)
  const handleDeclareWar = async () => {
    if (!selectedPlayer) return;
    
    setActionLoading(true);
    try {
      const mutation = `
        mutation DeclareWar($targetChain: String!) {
          declareWar(targetChain: $targetChain)
        }
      `;
      
      await lineraAdapter.mutate(mutation, {
        targetChain: selectedPlayer.address,
      });
      
      setActionResult({ success: true, message: `War declared on ${selectedPlayer.playerName}!` });
    } catch (e) {
      setActionResult({ success: false, message: `Failed to declare war: ${e}` });
    }
    setActionLoading(false);
  };

  // Get Linera connection
  const { mutate, isConnected, isAppConnected } = useLinera();

  // Handle launch invasion - uses Linera contract + backend simulation
  const handleLaunchInvasion = async () => {
    if (!selectedPlayer || !web3Address) return;
    
    setActionLoading(true);
    try {
      // First, call Linera contract if connected
      if (isConnected && mutate) {
        try {
          const attackFleet = fleets.find(f => f.ships.some(s => s.quantity > 0));
          const fleetId = attackFleet?.id ?? 1;
          
          console.log('🚀 Launching invasion via Linera contract...');
          console.log('🔗 Wallet connected:', isConnected, 'App connected:', isAppConnected);
          const targetChain = selectedPlayer.chainId || selectedPlayer.address;
          
          await mutate(LAUNCH_INVASION, {
            targetChain: targetChain,
            fleetId: fleetId,
            targetX: selectedPlayer.homeX || 0,
            targetY: selectedPlayer.homeY || 0,
          });
          
          console.log('✅ Invasion launched on-chain successfully!');
        } catch (lineraError) {
          console.warn('⚠️ Linera contract call failed, falling back to mock:', lineraError);
        }
      } else {
        console.log('⚠️ Not connected to Linera, using mock invasion');
      }
      
      // Execute battle simulation via backend
      const result = await executeInvasion(web3Address, selectedPlayer.address);
      
      if (result?.victory) {
        // Add loot to player's resources
        if (result.loot) {
          addResources({
            iron: result.loot.iron,
            deuterium: result.loot.deuterium,
            crystals: result.loot.crystals,
          });
          console.log('💰 Loot added to resources:', result.loot);
        }
        
        setActionResult({ 
          success: true, 
          message: `Victory! Captured ${result.loot?.iron || 0} iron, ${result.loot?.deuterium || 0} deuterium, ${result.loot?.crystals || 0} crystals!` 
        });
      } else {
        setActionResult({ 
          success: false, 
          message: result?.message || 'Invasion failed!' 
        });
      }
      
      // Refresh players list
      fetchPlayers();
    } catch (e) {
      setActionResult({ success: false, message: `Invasion failed: ${e}` });
    }
    setActionLoading(false);
  };

  const tabs = [
    { id: 'relations', label: 'Relations', icon: '🤝' },
    { id: 'proposals', label: 'Proposals', icon: '📜', badge: proposals.length },
    { id: 'wars', label: 'Active Wars', icon: '⚔️' },
  ];

  return (
    <div className="holo-panel flex h-full flex-col overflow-hidden p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-3xl font-bold text-white">
          Diplomacy & Warfare
        </h2>
        <p className="mt-1 font-body text-gray-400">
          Forge alliances, declare wars, and invade enemy territories
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="mb-6 flex flex-shrink-0 gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {tabs.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-display text-sm font-bold transition-all ${
              tab === t.id
                ? 'border-nebula-500 bg-nebula-500/20 text-white'
                : 'border-gray-700 bg-void/50 text-gray-400 hover:border-nebula-500/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
            {t.badge && t.badge > 0 && (
              <span className="ml-1 rounded-full bg-energy-500 px-2 py-0.5 text-xs text-white">
                {t.badge}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'relations' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-400">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-block text-2xl"
                >
                  🔄
                </motion.div>
                <p className="mt-2">Loading players...</p>
              </div>
            ) : galaxyPlayers.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <span className="text-4xl">🌌</span>
                <p className="mt-2">No other players found in the galaxy</p>
                <p className="text-sm">Be the first to build your empire!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {galaxyPlayers.map((player, i) => {
                  const threatLevel = player.powerLevel < 5 ? 'weak' : player.powerLevel < 15 ? 'medium' : 'strong';
                  
                  return (
                    <motion.div
                      key={player.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border border-gray-700 bg-void/50 p-4 hover:border-nebula-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            threatLevel === 'weak' ? 'bg-green-500/20' :
                            threatLevel === 'medium' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                          }`}>
                            <span className="text-2xl">👤</span>
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-white">{player.playerName}</h3>
                            <p className="text-xs text-gray-400">
                              ⚡{player.powerLevel} Power | 🚀{player.totalShips} Ships
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          threatLevel === 'weak' ? 'bg-green-500/20 text-green-400' :
                          threatLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {threatLevel}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <motion.button
                          className="flex-1 py-1.5 rounded-lg bg-energy-500/20 text-energy-400 text-xs font-bold hover:bg-energy-500/30"
                          onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setActionModal('alliance'); }}
                          whileHover={{ scale: 1.02 }}
                        >
                          🤝 Ally
                        </motion.button>
                        <motion.button
                          className="flex-1 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30"
                          onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setActionModal('war'); }}
                          whileHover={{ scale: 1.02 }}
                        >
                          ⚔️ War
                        </motion.button>
                        <motion.button
                          className="flex-1 py-1.5 rounded-lg bg-orange-500/20 text-orange-400 text-xs font-bold hover:bg-orange-500/30"
                          onClick={(e) => { e.stopPropagation(); setSelectedPlayer(player); setActionModal('invasion'); }}
                          whileHover={{ scale: 1.02 }}
                        >
                          🚀 Invade
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'proposals' && (
          <div className="space-y-4">
            {proposals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <span className="text-4xl">📭</span>
                <p className="mt-2">No pending proposals</p>
              </div>
            ) : (
              proposals.map((proposal, i) => (
                <motion.div
                  key={proposal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-energy-500/30 bg-energy-500/10 p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold text-white">{proposal.allianceName}</h3>
                      <p className="text-sm text-gray-400">From: {proposal.fromName}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {Math.floor((Date.now() - proposal.createdAt) / 60000)}m ago
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      className="flex-1 py-2 rounded-lg bg-energy-500 text-white font-bold hover:bg-energy-400"
                      whileHover={{ scale: 1.02 }}
                    >
                      ✅ Accept
                    </motion.button>
                    <motion.button
                      className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 font-bold hover:bg-gray-800"
                      whileHover={{ scale: 1.02 }}
                    >
                      ❌ Reject
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'wars' && (
          <div className="text-center text-gray-400 py-8">
            <span className="text-4xl">☮️</span>
            <p className="mt-2">No active wars</p>
            <p className="text-sm">Declare war on another player to begin conflict</p>
          </div>
        )}
      </div>

      {/* Action Modals */}
      <AnimatePresence>
        {actionModal && selectedPlayer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setActionModal(null); setActionResult(null); }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl border border-nebula-500/50 bg-void p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {actionResult ? (
                <>
                  <div className={`text-center mb-4 ${actionResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="text-4xl">{actionResult.success ? '✅' : '❌'}</span>
                    <h3 className="font-display text-xl font-bold mt-2">
                      {actionResult.success ? 'Success!' : 'Failed'}
                    </h3>
                    <p className="mt-2 text-sm">{actionResult.message}</p>
                  </div>
                  <motion.button
                    className="w-full py-2 rounded-lg bg-nebula-500 text-white font-bold"
                    onClick={() => { setActionModal(null); setActionResult(null); }}
                    whileHover={{ scale: 1.02 }}
                  >
                    Close
                  </motion.button>
                </>
              ) : (
                <>
                  <h3 className="font-display text-xl font-bold text-white mb-4">
                    {actionModal === 'alliance' && '🤝 Propose Alliance'}
                    {actionModal === 'war' && '⚔️ Declare War'}
                    {actionModal === 'invasion' && '🚀 Launch Invasion'}
                  </h3>
                  
                  <p className="text-gray-400 mb-4">
                    Target: <span className="text-white font-bold">{selectedPlayer.playerName}</span>
                  </p>
                  
                  {actionModal === 'alliance' && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-1">Alliance Name</label>
                      <input
                        type="text"
                        value={allianceName}
                        onChange={(e) => setAllianceName(e.target.value)}
                        placeholder="Enter alliance name..."
                        className="w-full rounded-lg border border-gray-700 bg-void/50 px-3 py-2 text-white focus:border-nebula-500 focus:outline-none"
                      />
                    </div>
                  )}
                  
                  {actionModal === 'invasion' && (
                    <div className="mb-4 p-3 rounded-lg bg-void/50 border border-gray-700">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Your Ships:</span>
                        <span className="text-energy-400 font-mono">{myTotalShips}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Enemy Ships:</span>
                        <span className="text-red-400 font-mono">{selectedPlayer.totalShips}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Required:</span>
                        <span className={`font-mono ${myTotalShips >= Math.floor(selectedPlayer.totalShips * 0.25) + 2 ? 'text-green-400' : 'text-red-400'}`}>
                          {Math.floor(selectedPlayer.totalShips * 0.25) + 2}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {actionModal === 'war' && (
                    <p className="mb-4 text-sm text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg p-3">
                      ⚠️ Declaring war will make this player hostile. They may retaliate!
                    </p>
                  )}
                  
                  <div className="flex gap-3">
                    <motion.button
                      className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                        actionModal === 'alliance' ? 'bg-energy-500 hover:bg-energy-400 text-white' :
                        actionModal === 'war' ? 'bg-red-500 hover:bg-red-400 text-white' :
                        'bg-orange-500 hover:bg-orange-400 text-white'
                      } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => {
                        if (actionModal === 'alliance') handleProposeAlliance();
                        else if (actionModal === 'war') handleDeclareWar();
                        else if (actionModal === 'invasion') handleLaunchInvasion();
                      }}
                      disabled={actionLoading}
                      whileHover={!actionLoading ? { scale: 1.02 } : {}}
                    >
                      {actionLoading ? 'Processing...' : 'Confirm'}
                    </motion.button>
                    <motion.button
                      className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 font-bold hover:bg-gray-800"
                      onClick={() => setActionModal(null)}
                      whileHover={{ scale: 1.02 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
