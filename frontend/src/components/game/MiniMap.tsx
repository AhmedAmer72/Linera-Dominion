'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import { useMemo } from 'react';

// Fleet icon with fallback
function FleetMarker() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-[10px]">🚀</span>;
  }
  
  return (
    <Image
      src="/images/ships/scout.png"
      alt="Fleet"
      width={28}
      height={28}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export function MiniMap() {
  const { knownPlanets, fleets, homeX, homeY } = useGameStore();

  // Generate star field for background
  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  return (
    <div className="holo-panel relative h-48 overflow-hidden p-4">
      <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-gray-400">
        Sector Map
      </h3>
      
      <div className="relative h-32 w-full rounded border border-nebula-500/20 bg-void/80 overflow-hidden">
        {/* Animated grid */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(98, 25, 255, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(98, 25, 255, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '20px 20px'],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Stars */}
        {stars.map((star, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 1.5, star.opacity],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Planets */}
        {knownPlanets.map((planet, i) => (
          <motion.div
            key={planet.id}
            className={`absolute h-3 w-3 rounded-full ${
              planet.owner === 'player' ? 'bg-energy-500' : 'bg-gray-500'
            }`}
            style={{
              left: `${((planet.x - homeX + 50) / 100) * 100}%`,
              top: `${((planet.y - homeY + 50) / 100) * 100}%`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.5 }}
          >
            {planet.owner === 'player' && (
              <motion.div
                className="absolute inset-0 rounded-full border border-energy-500"
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}

        {/* Fleets */}
        {fleets.map((fleet) => (
          <motion.div
            key={fleet.id}
            className="absolute h-2 w-2"
            style={{
              left: `${((fleet.x - homeX + 50) / 100) * 100}%`,
              top: `${((fleet.y - homeY + 50) / 100) * 100}%`,
            }}
            animate={
              fleet.status === 'moving'
                ? {
                    x: [0, 5, 0],
                    opacity: [1, 0.5, 1],
                  }
                : {}
            }
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <FleetMarker />
          </motion.div>
        ))}

        {/* Home indicator */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-4 w-4 rounded-full border-2 border-nebula-500 bg-nebula-500/30" />
        </motion.div>

        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-nebula-500/50 to-transparent"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Coordinates */}
      <div className="mt-2 flex justify-between font-body text-[10px] text-gray-500">
        <span>Sector (0, 0)</span>
        <span>Home: ({homeX}, {homeY})</span>
      </div>
    </div>
  );
}
