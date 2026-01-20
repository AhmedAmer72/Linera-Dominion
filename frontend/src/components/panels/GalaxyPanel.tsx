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
              </motion.div>

              {/* Planet label */}
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
                style={{ top: 25 * zoom }}
              >
                <p className="font-display text-xs font-bold text-white" style={{ fontSize: 10 * zoom }}>
                  {planet.name}
                </p>
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
  const planetColors = {
    rocky: '#8b7355',
    gas: '#e67e22',
    ice: '#87ceeb',
    volcanic: '#dc143c',
    oceanic: '#4169e1',
  };

  return (
    <motion.div
      className="absolute bottom-20 left-6 right-6 z-10 rounded-xl border border-nebula-500/50 bg-void/95 p-4 backdrop-blur-md"
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
            <h3 className="font-display text-xl font-bold text-white">{planet.name}</h3>
            <p className="font-body text-sm text-gray-400 capitalize">{planet.type} Planet</p>
            <p className="font-body text-xs text-gray-500">
              Coordinates: ({planet.x}, {planet.y})
            </p>
          </div>
        </div>
        <motion.button
          className="text-gray-400 hover:text-white"
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ✕
        </motion.button>
      </div>

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

      <div className="mt-4 flex gap-3">
        {planet.owner !== 'player' ? (
          <>
            <motion.button
              className="btn-primary flex-1"
              whileHover={{ scale: 1.02 }}
            >
              Send Fleet
            </motion.button>
            <motion.button
              className="flex-1 rounded-lg border border-plasma-500 py-2 font-display font-bold text-plasma-400 hover:bg-plasma-500/10"
              whileHover={{ scale: 1.02 }}
            >
              Colonize
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
