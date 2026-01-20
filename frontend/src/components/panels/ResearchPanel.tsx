'use client';

import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import Image from 'next/image';

// Research icon component with fallback
function ResearchIcon({ src, fallback, name }: { src: string; fallback: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-3xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={name}
      width={96}
      height={96}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

const technologies = [
  {
    id: 'AdvancedMining',
    name: 'Advanced Mining',
    icon: '⛏️',
    iconSrc: '/images/research/physics.png',
    description: 'Increases resource extraction efficiency',
    effect: '+15% mining rate per level',
    category: 'economy',
    maxLevel: 10,
    baseCost: { iron: 500, deuterium: 250, crystals: 100 },
    researchTime: 3600, // seconds
  },
  {
    id: 'ReinforcedHulls',
    name: 'Reinforced Hulls',
    icon: '🛡️',
    iconSrc: '/images/research/shields.png',
    description: 'Strengthens ship armor plating',
    effect: '+10% ship defense per level',
    category: 'defense',
    maxLevel: 10,
    baseCost: { iron: 800, deuterium: 400, crystals: 150 },
    researchTime: 5400,
  },
  {
    id: 'PlasmaWeapons',
    name: 'Plasma Weapons',
    icon: '🔫',
    iconSrc: '/images/research/physics.png',
    description: 'Advanced plasma-based weapon systems',
    effect: '+12% weapon damage per level',
    category: 'offense',
    maxLevel: 10,
    baseCost: { iron: 1000, deuterium: 500, crystals: 200 },
    researchTime: 7200,
  },
  {
    id: 'IonDrives',
    name: 'Ion Drives',
    icon: '🚀',
    iconSrc: '/images/research/propulsion.png',
    description: 'Improved propulsion technology',
    effect: '+20% fleet speed per level',
    category: 'mobility',
    maxLevel: 8,
    baseCost: { iron: 600, deuterium: 800, crystals: 100 },
    researchTime: 4800,
  },
  {
    id: 'WarpTechnology',
    name: 'Warp Technology',
    icon: '🌀',
    iconSrc: '/images/research/propulsion.png',
    description: 'Enables faster-than-light travel',
    effect: 'Unlocks warp gates, +5% range per level',
    category: 'mobility',
    maxLevel: 5,
    baseCost: { iron: 2000, deuterium: 1500, crystals: 500 },
    researchTime: 14400,
  },
  {
    id: 'ShieldHarmonics',
    name: 'Shield Harmonics',
    icon: '💠',
    iconSrc: '/images/research/shields.png',
    description: 'Advanced shield frequency modulation',
    effect: '+15% shield capacity per level',
    category: 'defense',
    maxLevel: 8,
    baseCost: { iron: 700, deuterium: 600, crystals: 300 },
    researchTime: 6000,
  },
  {
    id: 'NanoConstruction',
    name: 'Nano Construction',
    icon: '🔧',
    iconSrc: '/images/research/genetics.png',
    description: 'Nanobots accelerate building and repairs',
    effect: '-10% construction time per level',
    category: 'economy',
    maxLevel: 6,
    baseCost: { iron: 1500, deuterium: 1000, crystals: 400 },
    researchTime: 10800,
  },
  {
    id: 'LongRangeSensors',
    name: 'Long Range Sensors',
    icon: '📡',
    iconSrc: '/images/research/physics.png',
    description: 'Extended detection and scanning range',
    effect: '+25% sensor range per level',
    category: 'utility',
    maxLevel: 8,
    baseCost: { iron: 400, deuterium: 500, crystals: 200 },
    researchTime: 3600,
  },
  {
    id: 'StealthSystems',
    name: 'Stealth Systems',
    icon: '👻',
    iconSrc: '/images/research/shields.png',
    description: 'Cloaking technology for covert operations',
    effect: 'Unlocks stealth ships, +10% evasion',
    category: 'utility',
    maxLevel: 5,
    baseCost: { iron: 1200, deuterium: 800, crystals: 600 },
    researchTime: 12000,
  },
  {
    id: 'TemporalMechanics',
    name: 'Temporal Mechanics',
    icon: '⏰',
    iconSrc: '/images/research/genetics.png',
    description: 'Harness the power of Chronos Crystals',
    effect: 'Unlocks time-based abilities',
    category: 'special',
    maxLevel: 3,
    baseCost: { iron: 5000, deuterium: 3000, crystals: 2000 },
    researchTime: 36000,
  },
];

// Category icon with fallback
function CategoryIcon({ src, fallback }: { src: string; fallback: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-sm">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt="Category"
      width={32}
      height={32}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

const categories = [
  { id: 'all', label: 'All', icon: '📋', iconSrc: '/images/research/physics.png' },
  { id: 'economy', label: 'Economy', icon: '💰', iconSrc: '/images/resources/crystals.png' },
  { id: 'offense', label: 'Offense', icon: '⚔️', iconSrc: '/images/ships/dreadnought.png' },
  { id: 'defense', label: 'Defense', icon: '🛡️', iconSrc: '/images/research/shields.png' },
  { id: 'mobility', label: 'Mobility', icon: '🚀', iconSrc: '/images/research/propulsion.png' },
  { id: 'utility', label: 'Utility', icon: '🔧', iconSrc: '/images/research/genetics.png' },
  { id: 'special', label: 'Special', icon: '✨', iconSrc: '/images/resources/deuterium.png' },
];

export function ResearchPanel() {
  const { research, resources } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTech, setSelectedTech] = useState<typeof technologies[0] | null>(null);

  const filteredTechnologies = selectedCategory === 'all'
    ? technologies
    : technologies.filter(t => t.category === selectedCategory);

  const getResearchLevel = (id: string) => {
    const r = research.find(r => r.technology === id);
    return r?.level || 0;
  };

  const isResearching = (id: string) => {
    const r = research.find(r => r.technology === id);
    return r?.inProgress || false;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="holo-panel flex h-full flex-col overflow-hidden p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex-shrink-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="font-display text-3xl font-bold text-white">
          Research Laboratory
        </h2>
        <p className="mt-1 font-body text-gray-400">
          Unlock the secrets of the universe
        </p>
      </motion.div>

      {/* Active Research */}
      {research.some(r => r.inProgress) && (
        <motion.div
          className="mb-6 flex-shrink-0 rounded-xl border border-energy-500/30 bg-energy-500/10 p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-energy-500/20 overflow-hidden"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              >
                <Image
                  src="/images/research/physics.png"
                  alt="Research"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </motion.div>
              <div>
                <p className="font-display font-bold text-white">
                  {research.find(r => r.inProgress)?.technology} in progress
                </p>
                <p className="font-body text-sm text-energy-400">
                  Completion in 4h 32m
                </p>
              </div>
            </div>
            <motion.button
              className="rounded border border-red-500/50 px-4 py-2 font-display text-sm font-bold text-red-400 hover:bg-red-500/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-800">
            <motion.div
              className="h-full bg-gradient-to-r from-energy-600 to-energy-400"
              initial={{ width: 0 }}
              animate={{ width: '35%' }}
              transition={{ duration: 1 }}
            />
          </div>
        </motion.div>
      )}

      {/* Category Tabs */}
      <motion.div
        className="mb-6 flex flex-shrink-0 flex-wrap gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-display text-sm font-bold transition-all ${
              selectedCategory === category.id
                ? 'border-energy-500 bg-energy-500/20 text-white'
                : 'border-gray-700 bg-void/50 text-gray-400 hover:border-energy-500/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <CategoryIcon src={category.iconSrc} fallback={category.icon} />
            <span>{category.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Tech Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTechnologies.map((tech, i) => {
            const level = getResearchLevel(tech.id);
            const researching = isResearching(tech.id);
            const maxed = level >= tech.maxLevel;
            const cost = {
              iron: tech.baseCost.iron * (level + 1),
              deuterium: tech.baseCost.deuterium * (level + 1),
              crystals: tech.baseCost.crystals * (level + 1),
            };
            const canAfford = resources.iron >= cost.iron && 
                             resources.deuterium >= cost.deuterium && 
                             resources.crystals >= cost.crystals;

            return (
              <motion.div
                key={tech.id}
                className={`group relative overflow-hidden rounded-xl border transition-all ${
                  researching
                    ? 'border-energy-500 bg-energy-500/10'
                    : maxed
                    ? 'border-nebula-500 bg-nebula-500/10'
                    : 'border-gray-700 bg-void/50 hover:border-energy-500/50'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: maxed ? 1 : 1.02 }}
                onClick={() => !maxed && setSelectedTech(tech)}
              >
                {/* Level indicator */}
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  {Array.from({ length: tech.maxLevel }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i < level ? 'bg-energy-500' : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                <div className="p-4">
                  {/* Icon and Name */}
                  <div className="mb-3 flex items-center gap-3">
                    <motion.div
                      className={`flex h-16 w-16 items-center justify-center rounded-lg overflow-hidden ${
                        researching
                          ? 'bg-energy-500/30'
                          : 'bg-gradient-to-br from-energy-500/20 to-nebula-500/20'
                      }`}
                      animate={researching ? {
                        boxShadow: [
                          '0 0 10px rgba(0, 230, 108, 0.3)',
                          '0 0 30px rgba(0, 230, 108, 0.6)',
                          '0 0 10px rgba(0, 230, 108, 0.3)',
                        ],
                      } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ResearchIcon src={tech.iconSrc} fallback={tech.icon} name={tech.name} />
                    </motion.div>
                    <div>
                      <h3 className="font-display font-bold text-white">
                        {tech.name}
                      </h3>
                      <p className="font-body text-xs text-gray-400">
                        Level {level} / {tech.maxLevel}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-2 font-body text-sm text-gray-400">
                    {tech.description}
                  </p>
                  
                  {/* Effect */}
                  <p className="mb-4 font-body text-sm text-energy-400">
                    {tech.effect}
                  </p>

                  {!maxed && (
                    <>
                      {/* Cost */}
                      <div className="mb-3 flex gap-2">
                        <CostBadge iconSrc="/images/resources/iron.png" fallback="⛏️" value={cost.iron} available={resources.iron} />
                        <CostBadge iconSrc="/images/resources/deuterium.png" fallback="💧" value={cost.deuterium} available={resources.deuterium} />
                        <CostBadge iconSrc="/images/resources/crystals.png" fallback="💎" value={cost.crystals} available={resources.crystals} />
                      </div>

                      {/* Time */}
                      <p className="mb-3 font-body text-xs text-gray-500">
                        <Image src="/images/research/propulsion.png" alt="Time" width={14} height={14} className="inline mr-1" /> Research time: {formatTime(tech.researchTime * (level + 1))}
                      </p>

                      {/* Research Button */}
                      <motion.button
                        className={`w-full rounded-lg py-2 font-display text-sm font-bold uppercase tracking-wider transition-all ${
                          researching
                            ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                            : canAfford
                            ? 'bg-gradient-to-r from-energy-600 to-energy-500 text-white hover:from-energy-500 hover:to-energy-400'
                            : 'cursor-not-allowed bg-gray-800 text-gray-500'
                        }`}
                        whileHover={canAfford && !researching ? { scale: 1.02 } : {}}
                        whileTap={canAfford && !researching ? { scale: 0.98 } : {}}
                        disabled={!canAfford || researching}
                      >
                        {researching ? 'Researching...' : level > 0 ? `Upgrade to Lv.${level + 1}` : 'Research'}
                      </motion.button>
                    </>
                  )}

                  {maxed && (
                    <div className="rounded-lg bg-nebula-500/20 py-2 text-center font-display text-sm font-bold uppercase text-nebula-400">
                      ✓ Mastered
                    </div>
                  )}
                </div>

                {/* Researching animation */}
                {researching && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-energy-500/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Resource cost icon with fallback
function ResourceCostIcon({ src, fallback }: { src: string; fallback: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-sm">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt="Resource"
      width={32}
      height={32}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

function CostBadge({ iconSrc, fallback, value, available }: { iconSrc: string; fallback: string; value: number; available: number }) {
  const canAfford = available >= value;
  
  return (
    <div className={`flex items-center gap-1 rounded bg-void/50 px-2 py-1 ${
      canAfford ? 'text-gray-300' : 'text-red-400'
    }`}>
      <ResourceCostIcon src={iconSrc} fallback={fallback} />
      <span className="font-display text-xs font-bold">{value.toLocaleString()}</span>
    </div>
  );
}
