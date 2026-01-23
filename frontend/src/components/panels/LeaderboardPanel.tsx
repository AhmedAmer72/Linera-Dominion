'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getLeaderboard, getPlayerRank, LeaderboardEntry, PlayerRank } from '@/lib/leaderboardApi';
import { useGameStore } from '@/store/gameStore';

interface LeaderboardPanelProps {
  onClose?: () => void;
}

export function LeaderboardPanel({ onClose }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'buildings' | 'ships' | 'resources'>('score');
  const { web3Address } = useGameStore();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [leaderboardData, rankData] = await Promise.all([
        getLeaderboard(100, sortBy),
        web3Address ? getPlayerRank(web3Address) : null,
      ]);
      
      if (leaderboardData) {
        setLeaderboard(leaderboardData.leaderboard);
      }
      
      if (rankData) {
        setPlayerRank(rankData);
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [sortBy, web3Address]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-4xl max-h-[80vh] mx-4 rounded-xl border border-nebula-500/30 bg-void/95 backdrop-blur-md overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-nebula-600/20 to-plasma-600/20 border-b border-nebula-500/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏆</span>
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Galactic Leaderboard</h2>
                <p className="text-sm text-gray-400">Top commanders across the galaxy</p>
              </div>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg border border-gray-600 px-3 py-1 text-gray-400 hover:border-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Player Rank Badge */}
          {playerRank && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-energy-500/20 border border-energy-500/50 px-4 py-1.5">
              <span className="text-energy-400 font-bold">Your Rank: #{playerRank.rank}</span>
              <span className="text-gray-400">of {playerRank.totalPlayers}</span>
              <span className="text-plasma-400 font-mono">({formatNumber(playerRank.score)} pts)</span>
            </div>
          )}
        </div>
        
        {/* Sort Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-nebula-500/20">
          {[
            { key: 'score', label: '⭐ Score', icon: '⭐' },
            { key: 'buildings', label: '🏗️ Buildings', icon: '🏗️' },
            { key: 'ships', label: '🚀 Ships', icon: '🚀' },
            { key: 'resources', label: '💎 Resources', icon: '💎' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSortBy(tab.key as typeof sortBy)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                sortBy === tab.key
                  ? 'bg-nebula-500/30 text-nebula-400 border border-nebula-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Leaderboard Table */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                className="h-8 w-8 rounded-full border-2 border-nebula-500 border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="ml-3 text-gray-400">Loading leaderboard...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">🌌</span>
              <p className="text-gray-400">No players on the leaderboard yet.</p>
              <p className="text-gray-500 text-sm">Be the first to claim your spot!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500 text-sm border-b border-nebula-500/20">
                  <th className="pb-3 w-16">#</th>
                  <th className="pb-3">Commander</th>
                  <th className="pb-3 text-center">🏗️</th>
                  <th className="pb-3 text-center">🚀</th>
                  <th className="pb-3 text-right">Resources</th>
                  <th className="pb-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentPlayer = web3Address?.toLowerCase() === entry.address;
                  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                  
                  return (
                    <motion.tr
                      key={entry.address}
                      className={`border-b border-nebula-500/10 ${
                        isCurrentPlayer ? 'bg-energy-500/10' : 'hover:bg-white/5'
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <td className="py-3 font-mono">
                        {rankEmoji || <span className="text-gray-500">#{entry.rank}</span>}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className={isCurrentPlayer ? 'text-energy-400' : 'text-white'}>
                            {entry.playerName}
                          </span>
                          <span className="text-gray-600 text-xs font-mono">
                            {formatAddress(entry.address)}
                          </span>
                          {isCurrentPlayer && (
                            <span className="text-[10px] bg-energy-500/30 text-energy-400 px-1.5 py-0.5 rounded">YOU</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center text-gray-400">
                        {entry.totalBuildingLevels}
                      </td>
                      <td className="py-3 text-center text-gray-400">
                        {entry.totalShips}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <span className="text-orange-400">{formatNumber(entry.resources.iron)}</span>
                          <span className="text-cyan-400">{formatNumber(entry.resources.deuterium)}</span>
                          <span className="text-purple-400">{formatNumber(entry.resources.crystals)}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-mono text-plasma-400">
                        {formatNumber(entry.score)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-nebula-500/20 px-6 py-3 flex items-center justify-between text-sm text-gray-500">
          <span>Total Players: {leaderboard.length}</span>
          <span>Updates every action</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
