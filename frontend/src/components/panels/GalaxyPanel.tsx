'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { useState, useMemo, useRef, useEffect } from 'react';

// Fleet icon with fallback for galaxy view
function GalaxyFleetIcon({ size, fallback = '🚀' }: { size: number; fallback?: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span style={{ fontSize: size }}>{ fallback }</span>;
  }
  
  return (
    <Image
      src="/images/ships/scout.png"
      alt="Fleet"
      width={size}
      height={size}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export function GalaxyPanel() {
  const { knownPlanets, fleets, homeX, homeY } = useGameStore();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedPlanet, setSelectedPlanet] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate stars for the galaxy view
  const stars = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random() * 0.5 + 0.3,
      twinkleSpeed: Math.random() * 3 + 2,
    }));
  }, []);

  // Generate nebula clouds
  const nebulaClouds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 200 + 100,
      color: ['#6219ff', '#00b8e6', '#00e66c', '#9b59b6', '#e67e22'][i],
      opacity: Math.random() * 0.1 + 0.05,
    }));
  }, []);

  const planetColors = {
    rocky: '#8b7355',
    gas: '#e67e22',
    ice: '#87ceeb',
    volcanic: '#dc143c',
    oceanic: '#4169e1',
  };

  return (
    <div className="holo-panel flex h-full flex-col overflow-hidden p-6">
      {/* Header */}
      <motion.div
        className="mb-4 flex flex-shrink-0 items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="font-display text-3xl font-bold text-white">
            Galaxy Map
          </h2>
          <p className="mt-1 font-body text-gray-400">
            Explore the cosmos and discover new worlds
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-void/50 p-1">
            <motion.button
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-nebula-500/20 hover:text-white"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              whileTap={{ scale: 0.9 }}
            >
              −
            </motion.button>
            <span className="w-12 text-center font-display text-sm text-white">
              {Math.round(zoom * 100)}%
            </span>
            <motion.button
              className="flex h-8 w-8 items-center justify-center rounded text-gray-400 hover:bg-nebula-500/20 hover:text-white"
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              whileTap={{ scale: 0.9 }}
            >
              +
            </motion.button>
          </div>
          <motion.button
            className="rounded-lg border border-nebula-500 px-4 py-2 font-display text-sm font-bold text-nebula-400 transition-all hover:bg-nebula-500/10"
            onClick={() => { setOffset({ x: 0, y: 0 }); setZoom(1); }}
            whileHover={{ scale: 1.02 }}
          >
            Center Home
          </motion.button>
        </div>
      </motion.div>

      {/* Galaxy View */}
      <motion.div
        ref={containerRef}
        className="relative flex-1 overflow-hidden rounded-xl border border-nebula-500/30 bg-void/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (isDragging) {
            setOffset({
              x: offset.x + e.movementX / zoom,
              y: offset.y + e.movementY / zoom,
            });
          }
        }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {/* Nebula background */}
        {nebulaClouds.map((cloud) => (
          <motion.div
            key={cloud.id}
            className="absolute rounded-full blur-3xl"
            style={{
              left: `${cloud.x}%`,
              top: `${cloud.y}%`,
              width: cloud.size,
              height: cloud.size,
              background: `radial-gradient(circle, ${cloud.color} 0%, transparent 70%)`,
              opacity: cloud.opacity,
              transform: `translate(-50%, -50%) scale(${zoom})`,
            }}
            animate={{
              scale: [zoom, zoom * 1.1, zoom],
              opacity: [cloud.opacity, cloud.opacity * 1.5, cloud.opacity],
            }}
            transition={{
              duration: 10 + cloud.id * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Stars */}
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size * zoom,
              height: star.size * zoom,
            }}
            animate={{
              opacity: [star.brightness, star.brightness * 1.5, star.brightness],
            }}
            transition={{
              duration: star.twinkleSpeed,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(98, 25, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(98, 25, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: `${50 * zoom}px ${50 * zoom}px`,
            backgroundPosition: `${offset.x}px ${offset.y}px`,
          }}
        />

        {/* Planets */}
        {knownPlanets.map((planet, i) => {
          const planetX = 50 + ((planet.x - homeX) * 5 + offset.x) * zoom;
          const planetY = 50 + ((planet.y - homeY) * 5 + offset.y) * zoom;

          return (
            <motion.div
              key={planet.id}
              className="absolute cursor-pointer"
              style={{
                left: `${planetX}%`,
                top: `${planetY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedPlanet(planet)}
              whileHover={{ scale: 1.2 }}
            >
              {/* Planet glow */}
              <motion.div
                className="absolute inset-0 rounded-full blur-md"
                style={{
                  background: planetColors[planet.type as keyof typeof planetColors],
                  width: 30 * zoom,
                  height: 30 * zoom,
                  marginLeft: -15 * zoom,
                  marginTop: -15 * zoom,
                  opacity: 0.3,
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              
              {/* Planet body */}
              <motion.div
                className="relative rounded-full"
                style={{
                  width: 20 * zoom,
                  height: 20 * zoom,
                  background: `radial-gradient(circle at 30% 30%, ${planetColors[planet.type as keyof typeof planetColors]}, #111)`,
                  boxShadow: `0 0 ${10 * zoom}px ${planetColors[planet.type as keyof typeof planetColors]}`,
                }}
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Owner indicator */}
                {planet.owner === 'player' && (
                  <motion.div
                    className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-energy-500"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {/* Hostile indicator */}
                {(planet.owner === 'hostile' || planet.owner === 'enemy_empire') && (
                  <motion.div
                    className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
                {/* Ancient indicator */}
                {planet.owner === 'ancient' && (
                  <motion.div
                    className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-purple-500"
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>

              {/* Planet label */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
                style={{ top: 25 * zoom }}
              >
                <p className="font-display text-xs font-bold text-white" style={{ fontSize: 10 * zoom }}>
                  {planet.name}
                </p>
                {/* Difficulty indicator */}
                {planet.difficulty && (
                  <span 
                    className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      planet.difficulty === 'easy' ? 'bg-green-500/30 text-green-400' :
                      planet.difficulty === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                      planet.difficulty === 'hard' ? 'bg-orange-500/30 text-orange-400' :
                      'bg-red-500/30 text-red-400'
                    }`}
                    style={{ fontSize: 8 * zoom }}
                  >
                    {planet.difficulty}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Fleets */}
        {fleets.map((fleet) => {
          const fleetX = 50 + ((fleet.x - homeX) * 5 + offset.x) * zoom;
          const fleetY = 50 + ((fleet.y - homeY) * 5 + offset.y) * zoom;

          return (
            <motion.div
              key={fleet.id}
              className="absolute"
              style={{
                left: `${fleetX}%`,
                top: `${fleetY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={fleet.status === 'moving' ? {
                x: [0, 5, 0],
                opacity: [1, 0.7, 1],
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <GalaxyFleetIcon size={Math.round(16 * zoom)} />
            </motion.div>
          );
        })}

        {/* Home indicator */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            left: `${50 + offset.x * zoom}%`,
            top: `${50 + offset.y * zoom}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <motion.div
            className="rounded-full border-2 border-nebula-500"
            style={{
              width: 40 * zoom,
              height: 40 * zoom,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.8, 0.3, 0.8],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Scan line effect */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-nebula-500/30 to-transparent pointer-events-none"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Coordinates display */}
        <div className="absolute bottom-4 left-4 rounded bg-void/80 px-3 py-2 font-display text-xs text-gray-400">
          Sector: (0, 0) | Zoom: {Math.round(zoom * 100)}%
        </div>
      </motion.div>

      {/* Planet Details Panel */}
      <AnimatePresence>
        {selectedPlanet && (
          <PlanetDetailsPanel planet={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanetDetailsPanel({ planet, onClose }: { planet: any; onClose: () => void }) {
  const { fleets, research, buildings } = useGameStore();
  
  const planetColors = {
    rocky: '#8b7355',
    gas: '#e67e22',
    ice: '#87ceeb',
    volcanic: '#dc143c',
    oceanic: '#4169e1',
  };

  const difficultyColors = {
    easy: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    medium: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    hard: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
    extreme: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  };

  // Check if player meets invasion requirements
  const checkRequirements = () => {
    if (!planet.invasionRequirements) return { met: true, missing: [] };
    
    const req = planet.invasionRequirements;
    const missing: string[] = [];
    
    // Count total ships across all fleets
    const totalShips = fleets.reduce((sum, fleet) => 
      sum + fleet.ships.reduce((s, ship) => s + ship.quantity, 0), 0);
    
    // Count ships by type
    const shipCounts: Record<string, number> = {};
    fleets.forEach(fleet => {
      fleet.ships.forEach(ship => {
        shipCounts[ship.type] = (shipCounts[ship.type] || 0) + ship.quantity;
      });
    });
    
    // Check minimum ships
    if (req.minShips && totalShips < req.minShips) {
      missing.push(`Need ${req.minShips} ships (have ${totalShips})`);
    }
    
    // Check required ship types
    if (req.requiredShipTypes) {
      req.requiredShipTypes.forEach((r: { type: string; count: number }) => {
        const have = shipCounts[r.type] || 0;
        if (have < r.count) {
          missing.push(`Need ${r.count}x ${r.type} (have ${have})`);
        }
      });
    }
    
    // Check required technology
    if (req.requiredTechnology) {
      const hasTech = research.some(r => r.technology === req.requiredTechnology && r.level > 0);
      if (!hasTech) {
        missing.push(`Requires ${req.requiredTechnology} research`);
      }
    }
    
    // Check building level
    if (req.minBuildingLevel) {
      const building = buildings.find(b => b.type === req.minBuildingLevel.building);
      const level = building?.level || 0;
      if (level < req.minBuildingLevel.level) {
        missing.push(`Need ${req.minBuildingLevel.building} Level ${req.minBuildingLevel.level} (have ${level})`);
      }
    }
    
    return { met: missing.length === 0, missing };
  };

  const requirements = checkRequirements();
  const difficulty = planet.difficulty || 'medium';
  const diffStyle = difficultyColors[difficulty as keyof typeof difficultyColors];

  return (
    <motion.div
      className="absolute bottom-20 left-6 right-6 z-10 rounded-xl border border-nebula-500/50 bg-void/95 p-4 backdrop-blur-md max-h-[60vh] overflow-y-auto custom-scrollbar"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <motion.div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${planetColors[planet.type as keyof typeof planetColors]}, #111)`,
              boxShadow: `0 0 20px ${planetColors[planet.type as keyof typeof planetColors]}`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-bold text-white">{planet.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${diffStyle.bg} ${diffStyle.border} ${diffStyle.text} border`}>
                {difficulty}
              </span>
            </div>
            <p className="font-body text-sm text-gray-400 capitalize">{planet.type} Planet</p>
            <p className="font-body text-xs text-gray-500">
              Coordinates: ({planet.x}, {planet.y}) • Owner: {planet.owner || 'Unknown'}
            </p>
          </div>
        </div>
        <motion.button
          className="text-gray-400 hover:text-white cursor-pointer"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

      {/* Description */}
      {planet.description && (
        <p className="mt-3 text-sm text-gray-400 italic border-l-2 border-nebula-500/50 pl-3">
          {planet.description}
        </p>
      )}

      {/* Resources */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-700 bg-void/50 p-3">
          <p className="font-body text-xs text-gray-400">Iron Deposits</p>
          <p className="font-display text-lg font-bold text-iron">
            {planet.resources.iron.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-void/50 p-3">
          <p className="font-body text-xs text-gray-400">Deuterium</p>
          <p className="font-display text-lg font-bold text-deuterium">
            {planet.resources.deuterium.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-void/50 p-3">
          <p className="font-body text-xs text-gray-400">Crystals</p>
          <p className="font-display text-lg font-bold text-crystals">
            {planet.resources.crystals.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Defense Fleet */}
      {planet.defenseFleet && planet.defenseFleet.length > 0 && (
        <div className="mt-4">
          <h4 className="font-display text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
            <span>⚔️</span> Defense Fleet
          </h4>
          <div className="flex flex-wrap gap-2">
            {planet.defenseFleet.map((ship: { type: string; count: number }, i: number) => (
              <span key={i} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">
                {ship.count}x {ship.type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Invasion Requirements */}
      {planet.invasionRequirements && planet.owner !== 'player' && (
        <div className="mt-4">
          <h4 className="font-display text-sm font-bold text-nebula-400 mb-2 flex items-center gap-2">
            <span>📋</span> Invasion Requirements
          </h4>
          
          {/* Required Ships */}
          {planet.invasionRequirements.requiredShipTypes && (
            <div className="mb-2">
              <p className="text-xs text-gray-500 mb-1">Required Ships:</p>
              <div className="flex flex-wrap gap-2">
                {planet.invasionRequirements.requiredShipTypes.map((ship: { type: string; count: number }, i: number) => {
                  const have = fleets.reduce((sum, fleet) => 
                    sum + fleet.ships.filter(s => s.type === ship.type).reduce((s, sh) => s + sh.quantity, 0), 0);
                  const met = have >= ship.count;
                  return (
                    <span 
                      key={i} 
                      className={`px-2 py-1 rounded text-xs font-mono border ${
                        met 
                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                          : 'bg-gray-800 border-gray-600 text-gray-400'
                      }`}
                    >
                      {ship.count}x {ship.type} {met ? '✓' : `(${have})`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Min Total Ships */}
          {planet.invasionRequirements.minShips && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">
                Minimum Fleet Size: <span className="text-white font-mono">{planet.invasionRequirements.minShips} ships</span>
              </p>
            </div>
          )}

          {/* Required Technology */}
          {planet.invasionRequirements.requiredTechnology && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">
                Required Tech: <span className="text-plasma-400 font-mono">{planet.invasionRequirements.requiredTechnology}</span>
              </p>
            </div>
          )}

          {/* Required Building Level */}
          {planet.invasionRequirements.minBuildingLevel && (
            <div className="mb-2">
              <p className="text-xs text-gray-500">
                Required Building: <span className="text-energy-400 font-mono">
                  {planet.invasionRequirements.minBuildingLevel.building} Lv.{planet.invasionRequirements.minBuildingLevel.level}
                </span>
              </p>
            </div>
          )}

          {/* Status */}
          <div className={`mt-3 p-2 rounded-lg border ${requirements.met ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            {requirements.met ? (
              <p className="text-green-400 text-sm font-bold flex items-center gap-2">
                <span>✅</span> Ready to invade!
              </p>
            ) : (
              <div>
                <p className="text-red-400 text-sm font-bold flex items-center gap-2 mb-1">
                  <span>❌</span> Requirements not met
                </p>
                <ul className="text-xs text-red-300/80 space-y-0.5">
                  {requirements.missing.map((m, i) => (
                    <li key={i}>• {m}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex gap-3">
        {planet.owner !== 'player' ? (
          <>
            <motion.button
              className={`flex-1 py-2 rounded-lg font-display font-bold transition-all ${
                requirements.met 
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
              whileHover={requirements.met ? { scale: 1.02 } : {}}
              disabled={!requirements.met}
            >
              ⚔️ Invade Planet
            </motion.button>
            <motion.button
              className="flex-1 rounded-lg border border-nebula-500 py-2 font-display font-bold text-nebula-400 hover:bg-nebula-500/10"
              whileHover={{ scale: 1.02 }}
            >
              🚀 Send Scout
            </motion.button>
          </>
        ) : (
          <motion.button
            className="btn-primary flex-1"
            whileHover={{ scale: 1.02 }}
          >
            Manage Colony
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
