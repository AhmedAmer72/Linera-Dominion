'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';

// Navigation icon component with fallback
function NavIcon({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-2xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={52}
      height={52}
      className="object-contain drop-shadow-lg"
      onError={() => setImgError(true)}
    />
  );
}

const navItems = [
  { id: 'overview', iconSrc: '/images/buildings/shipyard.png', icon: '🏠', label: 'Overview' },
  { id: 'buildings', iconSrc: '/images/buildings/plasma-mine.png', icon: '🏗️', label: 'Buildings' },
  { id: 'fleets', iconSrc: '/images/ships/scout.png', icon: '🚀', label: 'Fleets' },
  { id: 'research', iconSrc: '/images/research/physics.png', icon: '🔬', label: 'Research' },
  { id: 'galaxy', iconSrc: '/images/research/propulsion.png', icon: '🌌', label: 'Galaxy' },
  { id: 'diplomacy', iconSrc: '/images/research/genetics.png', icon: '🤝', label: 'Diplomacy' },
] as const;

export function NavigationPanel() {
  const { selectedPanel, setSelectedPanel } = useGameStore();

  return (
    <div className="flex h-full flex-col gap-2">
      {navItems.map((item, index) => (
        <motion.button
          key={item.id}
          onClick={() => setSelectedPanel(item.id)}
          className={`group relative flex h-14 w-14 items-center justify-center rounded-lg border transition-all ${
            selectedPanel === item.id
              ? 'border-nebula-500 bg-nebula-500/20'
              : 'border-gray-700 bg-void/50 hover:border-nebula-500/50'
          }`}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + index * 0.05 }}
          whileHover={{ scale: 1.1, x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Active indicator */}
          {selectedPanel === item.id && (
            <motion.div
              className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r bg-nebula-500"
              layoutId="activeIndicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
          )}

          {/* Icon */}
          <motion.div
            className="flex items-center justify-center"
            animate={{
              scale: selectedPanel === item.id ? [1, 1.2, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <NavIcon src={item.iconSrc} fallback={item.icon} alt={item.label} />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            className="absolute left-full ml-3 whitespace-nowrap rounded bg-void/95 px-3 py-2 font-display text-sm font-bold text-white opacity-0 shadow-lg border border-nebula-500/30 group-hover:opacity-100 z-50"
            initial={{ x: -10 }}
            whileHover={{ x: 0 }}
          >
            {item.label}
            <div className="absolute left-0 top-1/2 -ml-1 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-nebula-500/30 bg-void/95" />
          </motion.div>

          {/* Glow effect when active */}
          {selectedPanel === item.id && (
            <motion.div
              className="absolute inset-0 -z-10 rounded-lg blur-md"
              style={{
                background: 'radial-gradient(circle, rgba(98, 25, 255, 0.4) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help button */}
      <motion.button
        className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-700 bg-void/50 transition-all hover:border-energy-500/50"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.1, x: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        <NavIcon src="/images/research/shields.png" fallback="❓" alt="Help" />
      </motion.button>
    </div>
  );
}
