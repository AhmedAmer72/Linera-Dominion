'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { ResourceBar } from './ResourceBar';
import { NavigationPanel } from './NavigationPanel';
import { OverviewPanel } from '../panels/OverviewPanel';
import { BuildingsPanel } from '../panels/BuildingsPanel';
import { FleetsPanel } from '../panels/FleetsPanel';
import { ResearchPanel } from '../panels/ResearchPanel';
import { GalaxyPanel } from '../panels/GalaxyPanel';
import { MiniMap } from './MiniMap';

export function GameHUD() {
  const { selectedPanel } = useGameStore();

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
        <NavigationPanel />
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
          <QuickActions />
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
    </motion.div>
  );
}

// Action icon component with fallback
function ActionIcon({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-2xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={56}
      height={56}
      className="object-contain drop-shadow-lg"
      onError={() => setImgError(true)}
    />
  );
}

function QuickActions() {
  const actions = [
    { iconSrc: '/images/buildings/plasma-mine.png', icon: '🏗️', label: 'Build', color: 'nebula' },
    { iconSrc: '/images/ships/battlecruiser.png', icon: '🚀', label: 'Fleet', color: 'plasma' },
    { iconSrc: '/images/research/physics.png', icon: '🔬', label: 'Research', color: 'energy' },
    { iconSrc: '/images/resources/crystals.png', icon: '💱', label: 'Trade', color: 'nebula' },
  ];

  return (
    <div className="holo-panel p-4">
      <h3 className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-gray-400">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            className="flex flex-col items-center justify-center rounded border border-nebula-500/30 bg-void/50 p-3 transition-all hover:border-nebula-500 hover:bg-nebula-500/10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
          >
            <ActionIcon src={action.iconSrc} fallback={action.icon} alt={action.label} />
            <span className="mt-1 font-body text-xs text-gray-300">{action.label}</span>
          </motion.button>
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
