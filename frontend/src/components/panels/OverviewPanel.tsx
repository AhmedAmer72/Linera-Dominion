'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Icon component with fallback
function GameIcon({ src, fallback, size = 64 }: { src: string; fallback: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-3xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export function OverviewPanel() {
  const { buildings, fleets, research, resources, resourceRates, refreshGameState, connected } = useGameStore();

  // Auto-refresh from blockchain every 60 seconds (silent, in background)
  useEffect(() => {
    if (!connected) return;
    
    // Initial refresh
    refreshGameState().catch(() => {});
    
    const interval = setInterval(() => {
      refreshGameState().catch(() => {});
    }, 60000);
    
    return () => clearInterval(interval);
  }, [connected, refreshGameState]);

  const stats = [
    { label: 'Buildings', value: buildings.length, icon: '🏗️', iconSrc: '/images/buildings/shipyard.png', color: 'nebula' },
    { label: 'Fleets', value: fleets.length, icon: '🚀', iconSrc: '/images/ships/scout.png', color: 'plasma' },
    { label: 'Technologies', value: research.filter(r => r.level > 0).length, icon: '🔬', iconSrc: '/images/research/physics.png', color: 'energy' },
    { label: 'Power Rating', value: 2450, icon: '⚡', iconSrc: '/images/buildings/defense-turret.png', color: 'nebula' },
  ];

  return (
    <div className="holo-panel h-full overflow-y-auto p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="font-display text-3xl font-bold text-white">
            Empire Overview
          </h2>
          <p className="mt-1 font-body text-gray-400">
            Manage your galactic dominion
          </p>
        </div>
      </motion.div>

      {/* Resource Production Rates */}
      <motion.div
        className="mb-6 rounded-lg border border-energy-500/30 bg-energy-500/10 p-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-energy-400">
          Production Rates (per hour)
        </h3>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">⛏️</span>
            <span className="font-display text-lg text-white">+{resourceRates.iron}</span>
            <span className="text-gray-400">Iron</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💧</span>
            <span className="font-display text-lg text-white">+{resourceRates.deuterium}</span>
            <span className="text-gray-400">Deuterium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">💎</span>
            <span className="font-display text-lg text-white">+{resourceRates.crystals}</span>
            <span className="text-gray-400">Crystals</span>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Build more Plasma Mines, Ore Processors, and Crystal Synthesizers to increase production!
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="relative overflow-hidden rounded-lg border border-nebula-500/30 bg-void/50 p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, borderColor: 'rgba(98, 25, 255, 0.6)' }}
          >
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 flex items-center justify-center">
                <GameIcon src={stat.iconSrc} fallback={stat.icon} size={48} />
              </div>
              <motion.span
                className="font-display text-3xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {stat.value}
              </motion.span>
            </div>
            <p className="mt-2 font-body text-sm text-gray-400">{stat.label}</p>
            
            {/* Decorative gradient */}
            <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-nebula-500/10 blur-xl" />
          </motion.div>
        ))}
      </div>

      {/* Active Constructions */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="mb-4 font-display text-lg font-bold text-white">
          Active Constructions
        </h3>
        <div className="space-y-3">
          <ProgressItem
            icon="🏗️"
            iconSrc="/images/buildings/shipyard.png"
            title="Shipyard Level 2"
            progress={65}
            timeRemaining="2h 15m"
            color="nebula"
          />
          <ProgressItem
            icon="🔬"
            iconSrc="/images/research/physics.png"
            title="Plasma Weapons Lv.1"
            progress={35}
            timeRemaining="4h 30m"
            color="energy"
          />
        </div>
      </motion.div>

      {/* Fleet Status */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="mb-4 font-display text-lg font-bold text-white">
          Fleet Status
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          {fleets.map((fleet, i) => (
            <motion.div
              key={fleet.id}
              className="rounded-lg border border-plasma-500/30 bg-void/50 p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ borderColor: 'rgba(0, 184, 230, 0.6)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center">
                    <GameIcon src="/images/ships/scout.png" fallback="🚀" size={40} />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white">{fleet.name}</p>
                    <p className="font-body text-xs text-gray-400">
                      {fleet.ships.reduce((acc, s) => acc + s.quantity, 0)} ships
                    </p>
                  </div>
                </div>
                <StatusBadge status={fleet.status} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h3 className="mb-4 font-display text-lg font-bold text-white">
          Recent Activity
        </h3>
        <div className="space-y-2">
          {[
            { time: '2 min ago', text: 'Resource collection completed', type: 'success' },
            { time: '15 min ago', text: 'Fleet Alpha returned home', type: 'info' },
            { time: '1 hour ago', text: 'Trade offer accepted', type: 'success' },
            { time: '2 hours ago', text: 'Enemy detected in sector 4-7', type: 'warning' },
          ].map((activity, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-3 rounded border-l-2 border-nebula-500/30 bg-void/30 py-2 pl-4 pr-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.05 }}
            >
              <span className={`h-2 w-2 rounded-full ${
                activity.type === 'success' ? 'bg-energy-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-plasma-500'
              }`} />
              <span className="flex-1 font-body text-sm text-gray-300">{activity.text}</span>
              <span className="font-body text-xs text-gray-500">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ProgressItem({ 
  icon,
  iconSrc,
  title, 
  progress, 
  timeRemaining, 
  color 
}: { 
  icon: string;
  iconSrc: string;
  title: string; 
  progress: number; 
  timeRemaining: string;
  color: 'nebula' | 'plasma' | 'energy';
}) {
  const gradients = {
    nebula: 'from-nebula-600 to-nebula-400',
    plasma: 'from-plasma-600 to-plasma-400',
    energy: 'from-energy-600 to-energy-400',
  };

  return (
    <div className="rounded-lg border border-nebula-500/30 bg-void/50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 flex items-center justify-center">
            <GameIcon src={iconSrc} fallback={icon} size={32} />
          </div>
          <span className="font-display font-bold text-white">{title}</span>
        </div>
        <span className="font-body text-sm text-gray-400">{timeRemaining}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-gray-800">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${gradients[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="mt-1 text-right font-body text-xs text-gray-500">{progress}%</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    idle: 'border-energy-500/50 bg-energy-500/10 text-energy-400',
    moving: 'border-plasma-500/50 bg-plasma-500/10 text-plasma-400',
    combat: 'border-red-500/50 bg-red-500/10 text-red-400',
    docked: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
  };

  return (
    <motion.span
      className={`rounded-full border px-3 py-1 font-display text-xs font-bold uppercase ${styles[status as keyof typeof styles] || styles.idle}`}
      animate={status === 'combat' ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 0.5, repeat: Infinity }}
    >
      {status}
    </motion.span>
  );
}
