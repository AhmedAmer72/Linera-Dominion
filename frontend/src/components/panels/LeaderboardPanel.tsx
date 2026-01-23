'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { getLeaderboard, getPlayerRank, LeaderboardEntry, PlayerRank } from '@/lib/leaderboardApi';
import { useGameStore } from '@/store/gameStore';

interface LeaderboardPanelProps {
  onClose: () => void;
}

export function LeaderboardPanel({ onClose }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<PlayerRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'buildings' | 'ships' | 'resources'>('score');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const { web3Address } = useGameStore();

  // Handle close with safety check
  const handleClose = useCallback(() => {
    console.log('🔒 Closing leaderboard panel');
    onClose();
  }, [onClose]);

  // Handle escape key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
    return num.toLocaleString();
  };

  const sortTabs = [
    { key: 'score', label: 'Score', icon: '⭐' },
    { key: 'buildings', label: 'Buildings', icon: '🏗️' },
    { key: 'ships', label: 'Ships', icon: '🚀' },
    { key: 'resources', label: 'Resources', icon: '💎' },
  ] as const;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        onClick={handleClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      {/* Modal */}
      <motion.div
        className="relative w-full max-w-4xl max-h-[85vh] mx-4 rounded-2xl border border-nebula-500/40 bg-gradient-to-b from-void/98 to-void/95 shadow-2xl shadow-nebula-500/20 overflow-hidden flex flex-col"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-500/10 via-nebula-500/10 to-plasma-500/10 border-b border-nebula-500/30 px-6 py-5">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-plasma-500/5" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.span 
                className="text-4xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                🏆
              </motion.span>
              <div>
                <h2 className="font-display text-2xl font-bold text-white tracking-wide">
                  Galactic Leaderboard
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Top commanders across the galaxy
                </p>
              </div>
            </div>
            
            {/* Close button */}
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-600/50 bg-void/50 text-gray-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
          
          {/* Player Rank Badge */}
          <AnimatePresence>
            {playerRank && (
              <motion.div 
                className="mt-4 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-energy-500/20 to-plasma-500/20 border border-energy-500/40 px-5 py-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-energy-400 font-display font-bold text-lg">#{playerRank.rank}</span>
                  <span className="text-gray-500 text-sm">of {playerRank.totalPlayers}</span>
                </div>
                <div className="w-px h-4 bg-gray-600" />
                <span className="text-plasma-400 font-mono font-bold">{formatNumber(playerRank.score)} pts</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Sort Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-nebula-500/20 bg-void/50">
          {sortTabs.map((tab) => (
            <motion.button
              key={tab.key}
              onClick={() => setSortBy(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === tab.key
                  ? 'bg-nebula-500/30 text-white border border-nebula-500/50 shadow-lg shadow-nebula-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </motion.button>
          ))}
          
          {/* Keyboard hint */}
          <div className="ml-auto flex items-center gap-2 text-gray-600 text-xs">
            <kbd className="px-2 py-1 rounded bg-gray-800 border border-gray-700">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
        
        {/* Leaderboard Content */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <motion.div
                className="h-12 w-12 rounded-full border-4 border-nebula-500/30 border-t-nebula-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="mt-4 text-gray-400">Loading commanders...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <motion.span 
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🌌
              </motion.span>
              <p className="text-xl text-gray-300 font-display">No commanders yet</p>
              <p className="text-gray-500 mt-2">Be the first to claim your spot in the galaxy!</p>
            </div>
          ) : (
            <div className="px-6 py-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-nebula-500/20 sticky top-0 bg-void/95 backdrop-blur-sm z-10">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Commander</div>
                <div className="col-span-2 text-center">Buildings</div>
                <div className="col-span-2 text-center">Fleet</div>
                <div className="col-span-3 text-right">Score</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-nebula-500/10">
                {leaderboard.map((entry, index) => {
                  const isCurrentPlayer = web3Address?.toLowerCase() === entry.address;
                  const isHovered = hoveredRow === entry.address;
                  const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                  
                  return (
                    <motion.div
                      key={entry.address}
                      className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-all cursor-default ${
                        isCurrentPlayer 
                          ? 'bg-energy-500/15 border border-energy-500/30' 
                          : isHovered
                          ? 'bg-white/5'
                          : ''
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onMouseEnter={() => setHoveredRow(entry.address)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center">
                        {rankEmoji ? (
                          <span className="text-xl">{rankEmoji}</span>
                        ) : (
                          <span className="text-gray-500 font-mono text-sm">#{entry.rank}</span>
                        )}
                      </div>
                      
                      {/* Commander */}
                      <div className="col-span-4 flex items-center gap-2 min-w-0">
                        <span className={`font-medium truncate ${isCurrentPlayer ? 'text-energy-400' : 'text-white'}`}>
                          {entry.playerName}
                        </span>
                        <span className="text-gray-600 text-xs font-mono shrink-0">
                          {formatAddress(entry.address)}
                        </span>
                        {isCurrentPlayer && (
                          <span className="text-[10px] bg-energy-500/30 text-energy-400 px-2 py-0.5 rounded-full font-bold shrink-0">
                            YOU
                          </span>
                        )}
                      </div>
                      
                      {/* Buildings */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="text-sm">🏗️</span>
                          <span className="font-mono text-sm">{entry.totalBuildingLevels}</span>
                        </div>
                      </div>
                      
                      {/* Ships */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="text-sm">🚀</span>
                          <span className="font-mono text-sm">{entry.totalShips}</span>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div className="col-span-3 flex items-center justify-end">
                        <motion.span 
                          className={`font-mono font-bold ${
                            entry.rank <= 3 ? 'text-yellow-400' : 'text-plasma-400'
                          }`}
                          animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
                        >
                          {formatNumber(entry.score)}
                        </motion.span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-nebula-500/20 px-6 py-3 flex items-center justify-between bg-void/80">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>👥 {leaderboard.length} commanders</span>
          </div>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="px-4 py-2 rounded-lg bg-nebula-500/20 border border-nebula-500/40 text-nebula-400 font-medium hover:bg-nebula-500/30 transition-all cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Close
          </motion.button>
        </div>
      </motion.div>
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(98, 25, 255, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(98, 25, 255, 0.5);
        }
      `}</style>
    </motion.div>
  );
}
