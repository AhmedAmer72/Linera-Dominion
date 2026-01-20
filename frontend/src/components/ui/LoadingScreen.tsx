'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// Logo component with fallback
function LogoWithFallback() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return (
      <span className="font-display text-5xl font-black text-white glow-text">
        LD
      </span>
    );
  }
  
  return (
    <Image
      src="/images/logo.png"
      alt="Linera Dominion"
      width={180}
      height={180}
      className="object-contain"
      onError={() => setImgError(true)}
      priority
    />
  );
}

const loadingMessages = [
  'Initializing quantum drives...',
  'Calibrating hyperspatial coordinates...',
  'Establishing neural link...',
  'Synchronizing temporal matrices...',
  'Loading star charts...',
  'Deploying reconnaissance drones...',
  'Activating defense grid...',
  'Preparing for launch...',
];

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 400);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  console.log('LoadingScreen rendering, progress:', progress);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0f]"
      style={{ zIndex: 100 }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Animated logo */}
      <motion.div
        className="relative mb-12"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        {/* Outer ring */}
        <motion.div
          className="absolute -inset-4 rounded-full border-4 border-nebula-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Middle ring */}
        <motion.div
          className="absolute -inset-2 rounded-full border-2 border-plasma-500"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-energy-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Center logo image */}
        <motion.div
          className="relative flex h-[200px] w-[200px] items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-nebula-500/20 to-plasma-500/20"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(98, 25, 255, 0.4)',
              '0 0 60px rgba(98, 25, 255, 0.8)',
              '0 0 20px rgba(98, 25, 255, 0.4)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <LogoWithFallback />
        </motion.div>
        
        {/* Orbiting dots */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-3 rounded-full bg-nebula-400"
            style={{
              top: '50%',
              left: '50%',
              marginTop: -6,
              marginLeft: -6,
            }}
            animate={{
              x: [0, 100 * Math.cos((i * Math.PI) / 2), 0, -100 * Math.cos((i * Math.PI) / 2), 0],
              y: [0, 100 * Math.sin((i * Math.PI) / 2), 0, -100 * Math.sin((i * Math.PI) / 2), 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>

      {/* Title */}
      <motion.h1
        className="mb-2 font-display text-4xl font-black tracking-wider"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <span className="bg-gradient-to-r from-nebula-400 via-plasma-400 to-energy-400 bg-clip-text text-transparent">
          LINERA DOMINION
        </span>
      </motion.h1>
      
      <motion.p
        className="mb-8 font-body text-lg text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Blockchain-Powered Space MMORTS
      </motion.p>

      {/* Loading bar */}
      <motion.div
        className="relative h-2 w-80 overflow-hidden rounded-full bg-gray-800"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-nebula-500 via-plasma-500 to-energy-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.3 }}
        />
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Progress percentage */}
      <motion.div
        className="mt-4 font-display text-xl text-nebula-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {Math.min(Math.round(progress), 100)}%
      </motion.div>

      {/* Loading message */}
      <motion.p
        key={messageIndex}
        className="mt-4 font-body text-sm text-gray-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {loadingMessages[messageIndex]}
      </motion.p>

      {/* Scan line effect */}
      <motion.div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-nebula-500/5 to-transparent"
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />
    </motion.div>
  );
}
