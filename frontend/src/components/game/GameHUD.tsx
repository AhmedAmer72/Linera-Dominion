'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { ResourceBar } from './ResourceBar';
import { NavigationPanel } from './NavigationPanel';
import { OverviewPanel } from '../panels/OverviewPanel';
import { BuildingsPanel } from '../panels/BuildingsPanel';
import { FleetsPanel } from '../panels/FleetsPanel';
import { ResearchPanel } from '../panels/ResearchPanel';
import { GalaxyPanel } from '../panels/GalaxyPanel';
import { DiplomacyPanel } from '../panels/DiplomacyPanel';
import { LeaderboardPanel } from '../panels/LeaderboardPanel';
import { MiniMap } from './MiniMap';

export function GameHUD() {
  const { selectedPanel } = useGameStore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const renderPanel = () => {
    switch (selectedPanel) {
      case 'overview':
        return <OverviewPanel />;
      case 'buildings':
        return <BuildingsPanel />;
      case 'fleets':
        return <FleetsPanel />;
      case 'research':
        return <ResearchPanel />;
      case 'galaxy':
        return <GalaxyPanel />;
      case 'diplomacy':
        return <DiplomacyPanel />;
      default:
        return <OverviewPanel />;
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-30 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Top HUD - Resources */}
      <motion.div
        className="pointer-events-auto absolute left-0 right-0 top-0 z-40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
      >
        <ResourceBar />
      </motion.div>

      {/* Left Panel - Navigation */}
      <motion.div
        className="pointer-events-auto absolute bottom-4 left-4 top-24 z-30 w-20"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        <NavigationPanel onLeaderboard={() => setShowLeaderboard(true)} />
      </motion.div>

      {/* Main Content Panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPanel}
          className="pointer-events-auto absolute bottom-4 left-28 right-80 top-24 z-20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {renderPanel()}
        </motion.div>
      </AnimatePresence>

      {/* Right Side - MiniMap & Quick Actions */}
      <motion.div
        className="pointer-events-auto absolute bottom-4 right-4 top-24 z-30 w-72"
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
      >
        <div className="flex h-full flex-col gap-4">
          <MiniMap />
          <RecentActions />
          <EventLog />
        </div>
      </motion.div>

      {/* Bottom notification bar */}
      <motion.div
        className="pointer-events-auto absolute bottom-0 left-0 right-0 z-40"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
      >
        <NotificationBar />
      </motion.div>
      
      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardPanel onClose={() => setShowLeaderboard(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Recent Actions - shows the last actions the user performed
function RecentActions() {
  const { buildings, fleets, research } = useGameStore();
  
  // Generate recent actions from game state
  const recentActions: Array<{ icon: string; label: string; detail: string; time: string }> = [];
  
  // Add recent buildings (sorted by construction time or ID as proxy)
  buildings.slice(-2).forEach(b => {
    recentActions.push({
      icon: '🏗️',
      label: `Built ${b.type}`,
      detail: `Level ${b.level}`,
      time: 'Recent',
    });
  });
  
  // Add recent fleets
  fleets.slice(-1).forEach(f => {
    const totalShips = f.ships.reduce((sum, s) => sum + s.quantity, 0);
    recentActions.push({
      icon: '🚀',
      label: f.name,
      detail: `${totalShips} ships`,
      time: 'Recent',
    });
  });
  
  // Add research in progress
  research.filter(r => r.inProgress).forEach(r => {
    recentActions.push({
      icon: '🔬',
      label: 'Researching',
      detail: r.technology,
      time: 'In Progress',
    });
  });
  
  // If no actions, show empty state
  if (recentActions.length === 0) {
    recentActions.push(
      { icon: '💡', label: 'Build something', detail: 'Start your empire', time: '' },
      { icon: '🚀', label: 'Create a fleet', detail: 'Explore the galaxy', time: '' },
    );
  }

  return (
    <div className="holo-panel p-4">
      <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-gray-400">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {recentActions.slice(0, 4).map((action, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 rounded border border-nebula-500/20 bg-void/30 p-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <span className="text-xl">{action.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs text-white truncate">{action.label}</p>
              <p className="font-body text-[10px] text-gray-500 truncate">{action.detail}</p>
            </div>
            {action.time && (
              <span className="font-body text-[10px] text-gray-600">{action.time}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EventLog() {
  const events = [
    { time: '2m ago', message: 'Fleet Alpha returned home', type: 'info' },
    { time: '5m ago', message: 'Research completed: Plasma Weapons', type: 'success' },
    { time: '12m ago', message: 'Enemy fleet detected in sector 4-7', type: 'warning' },
    { time: '15m ago', message: 'Building upgrade finished', type: 'info' },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-energy-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="holo-panel flex-1 overflow-hidden p-4">
      <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-gray-400">
        Event Log
      </h3>
      <div className="space-y-2 overflow-y-auto">
        {events.map((event, i) => (
          <motion.div
            key={i}
            className="border-l-2 border-nebula-500/30 pl-3 py-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <p className={`font-body text-xs ${getTypeColor(event.type)}`}>
              {event.message}
            </p>
            <span className="font-body text-[10px] text-gray-600">{event.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function NotificationBar() {
  return (
    <div className="flex items-center justify-between bg-void/80 px-6 py-2 backdrop-blur-sm border-t border-nebula-500/20">
      <div className="flex items-center gap-4">
        <motion.div
          className="flex items-center gap-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-2 w-2 rounded-full bg-energy-500" />
          <span className="font-body text-xs text-gray-400">Synced with Linera Network</span>
        </motion.div>
        <span className="font-body text-xs text-gray-600">|</span>
        <span className="font-body text-xs text-gray-400">Block #1,234,567</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-body text-xs text-gray-400">Home: (100, 200)</span>
        <span className="font-body text-xs text-gray-600">|</span>
        <span className="font-display text-xs font-bold text-nebula-400">COMMANDER</span>
      </div>
    </div>
  );
}
