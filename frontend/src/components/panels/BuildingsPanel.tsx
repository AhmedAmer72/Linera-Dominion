'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import Image from 'next/image';

// Icon component with fallback
function BuildingIcon({ src, fallback, name }: { src: string; fallback: string; name: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-3xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={name}
      width={64}
      height={64}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

const buildingTypes = [
  { 
    type: 'MinerDrone', 
    icon: '⛏️',
    iconSrc: '/images/buildings/plasma-mine.png',
    name: 'Plasma Mine', 
    description: 'Extracts iron from asteroid fields',
    produces: 'Iron +50/h per level',
    cost: { iron: 100, deuterium: 50, crystals: 0 },
    category: 'production'
  },
  { 
    type: 'GasSiphon', 
    icon: '💨',
    iconSrc: '/images/buildings/ore-processor.png',
    name: 'Ore Processor', 
    description: 'Processes raw materials into deuterium',
    produces: 'Deuterium +30/h per level',
    cost: { iron: 150, deuterium: 25, crystals: 10 },
    category: 'production'
  },
  { 
    type: 'ChronosCollider', 
    icon: '💎',
    iconSrc: '/images/buildings/research-lab.png',
    name: 'Crystal Synthesizer', 
    description: 'Synthesizes rare Chronos Crystals',
    produces: 'Crystals +10/h per level',
    cost: { iron: 500, deuterium: 200, crystals: 50 },
    category: 'production'
  },
  { 
    type: 'Shipyard', 
    icon: '🚢',
    iconSrc: '/images/buildings/shipyard.png',
    name: 'Star Forge', 
    description: 'Constructs and repairs spacecraft',
    produces: 'Ship build speed +10% per level',
    cost: { iron: 300, deuterium: 100, crystals: 25 },
    category: 'military'
  },
  { 
    type: 'WarpGate', 
    icon: '🌀',
    iconSrc: '/images/buildings/shipyard.png',
    name: 'Warp Gate', 
    description: 'Enables instant fleet teleportation',
    produces: 'Fleet range +20% per level',
    cost: { iron: 1000, deuterium: 500, crystals: 100 },
    category: 'utility'
  },
  { 
    type: 'ResearchLab', 
    icon: '🔬',
    iconSrc: '/images/buildings/research-lab.png',
    name: 'Research Lab', 
    description: 'Unlocks advanced technologies',
    produces: 'Research speed +15% per level',
    cost: { iron: 400, deuterium: 200, crystals: 75 },
    category: 'utility'
  },
  { 
    type: 'PlanetaryShield', 
    icon: '🛡️',
    iconSrc: '/images/buildings/defense-turret.png',
    name: 'Planetary Shield', 
    description: 'Protects your homeworld from attacks',
    produces: 'Defense +500 per level',
    cost: { iron: 600, deuterium: 300, crystals: 150 },
    category: 'defense'
  },
  { 
    type: 'OrbitalCannon', 
    icon: '🔫',
    iconSrc: '/images/buildings/defense-turret.png',
    name: 'Orbital Cannon', 
    description: 'Long-range planetary defense system',
    produces: 'Attack power +200 per level',
    cost: { iron: 800, deuterium: 400, crystals: 100 },
    category: 'defense'
  },
];

const categories = [
  { id: 'all', label: 'All', icon: '📋' },
  { id: 'production', label: 'Production', icon: '⚙️' },
  { id: 'military', label: 'Military', icon: '⚔️' },
  { id: 'defense', label: 'Defense', icon: '🛡️' },
  { id: 'utility', label: 'Utility', icon: '🔧' },
];

export function BuildingsPanel() {
  const { buildings, resources, buildBuilding, homeX, homeY } = useGameStore();
  const [isBuilding, setIsBuilding] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBuilding, setSelectedBuilding] = useState<typeof buildingTypes[0] | null>(null);

  const filteredBuildings = selectedCategory === 'all' 
    ? buildingTypes 
    : buildingTypes.filter(b => b.category === selectedCategory);

  const getBuildingLevel = (type: string) => {
    const building = buildings.find(b => b.type === type);
    return building?.level || 0;
  };

  const canAfford = (cost: { iron: number; deuterium: number; crystals: number }) => {
    return resources.iron >= cost.iron && 
           resources.deuterium >= cost.deuterium && 
           resources.crystals >= cost.crystals;
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
          Building Management
        </h2>
        <p className="mt-1 font-body text-gray-400">
          Construct and upgrade your empire's infrastructure
        </p>
      </motion.div>

      {/* Category Tabs */}
      <motion.div
        className="mb-6 flex flex-shrink-0 gap-2 overflow-x-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 font-display text-sm font-bold transition-all ${
              selectedCategory === category.id
                ? 'border-nebula-500 bg-nebula-500/20 text-white'
                : 'border-gray-700 bg-void/50 text-gray-400 hover:border-nebula-500/50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Buildings Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredBuildings.map((building, i) => {
              const level = getBuildingLevel(building.type);
              const affordable = canAfford(building.cost);

              return (
                <motion.div
                  key={building.type}
                  className={`group relative overflow-hidden rounded-xl border transition-all ${
                    selectedBuilding?.type === building.type
                      ? 'border-nebula-500 bg-nebula-500/10'
                      : 'border-gray-700 bg-void/50 hover:border-nebula-500/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedBuilding(building)}
                  layout
                >
                  {/* Level badge */}
                  {level > 0 && (
                    <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-nebula-500 font-display text-sm font-bold text-white">
                      {level}
                    </div>
                  )}

                  <div className="p-4">
                    {/* Icon and Name */}
                    <div className="mb-3 flex items-center gap-3">
                      <motion.div
                        className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-nebula-500/20 to-plasma-500/20 overflow-hidden"
                        animate={{
                          boxShadow: [
                            '0 0 10px rgba(98, 25, 255, 0.2)',
                            '0 0 20px rgba(98, 25, 255, 0.4)',
                            '0 0 10px rgba(98, 25, 255, 0.2)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <BuildingIcon src={building.iconSrc} fallback={building.icon} name={building.name} />
                      </motion.div>
                      <div>
                        <h3 className="font-display font-bold text-white">
                          {building.name}
                        </h3>
                        <p className="font-body text-xs text-energy-400">
                          {building.produces}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 font-body text-sm text-gray-400">
                      {building.description}
                    </p>

                    {/* Cost */}
                    <div className="mb-3 flex gap-3">
                      <CostItem 
                        icon="⛏️" 
                        value={building.cost.iron * (level + 1)} 
                        available={resources.iron}
                      />
                      <CostItem 
                        icon="💧" 
                        value={building.cost.deuterium * (level + 1)} 
                        available={resources.deuterium}
                      />
                      {building.cost.crystals > 0 && (
                        <CostItem 
                          icon="💎" 
                          value={building.cost.crystals * (level + 1)} 
                          available={resources.crystals}
                        />
                      )}
                    </div>

                    {/* Build Button */}
                    <motion.button
                      className={`w-full rounded-lg py-2 font-display text-sm font-bold uppercase tracking-wider transition-all ${
                        affordable && !isBuilding
                          ? 'bg-gradient-to-r from-nebula-600 to-nebula-500 text-white hover:from-nebula-500 hover:to-nebula-400'
                          : 'cursor-not-allowed bg-gray-800 text-gray-500'
                      }`}
                      whileHover={affordable && !isBuilding ? { scale: 1.02 } : {}}
                      whileTap={affordable && !isBuilding ? { scale: 0.98 } : {}}
                      disabled={!affordable || isBuilding}
                      onClick={async () => {
                        if (!affordable || isBuilding) return;
                        setIsBuilding(true);
                        try {
                          // Use homeX, homeY as base + offset based on building count
                          const offsetX = buildings.filter(b => b.type === building.type).length;
                          await buildBuilding(building.type, homeX + offsetX, homeY);
                          console.log('✅ Building queued:', building.name);
                        } catch (error) {
                          console.error('❌ Build failed:', error);
                        } finally {
                          setIsBuilding(false);
                        }
                      }}
                    >
                      {isBuilding ? 'Building...' : (level > 0 ? `Upgrade to Level ${level + 1}` : 'Build')}
                    </motion.button>
                  </div>

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CostItem({ icon, value, available }: { icon: string; value: number; available: number }) {
  const canAfford = available >= value;
  
  return (
    <div className={`flex items-center gap-1 rounded bg-void/50 px-2 py-1 ${
      canAfford ? 'text-gray-300' : 'text-red-400'
    }`}>
      <span className="text-sm">{icon}</span>
      <span className="font-display text-xs font-bold">{value.toLocaleString()}</span>
    </div>
  );
}
