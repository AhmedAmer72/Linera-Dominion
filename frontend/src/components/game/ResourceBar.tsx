'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useWallet } from '@/hooks/useWallet';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// Resource icon component with fallback
function ResourceIcon({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-2xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// Settings icon - using emoji since no custom settings icon exists
function SettingsIcon() {
  return <span className="text-2xl">⚙️</span>;
}

// Logo component with fallback
function LogoIcon() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="font-display text-lg font-black text-white">LD</span>;
  }
  
  return (
    <Image
      src="/images/logo.png"
      alt="Linera Dominion"
      width={48}
      height={48}
      className="object-contain"
      onError={() => setImgError(true)}
      priority
    />
  );
}

// Connect Wallet Button
function ConnectWalletButton() {
  const { connected, shortChainId, shortWeb3Address, isConnecting, walletError, connectWallet, disconnectWallet } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Note: restoreConnection is called from MainMenu, no need to call it here again

  if (connected && shortWeb3Address) {
    return (
      <div className="relative">
        <motion.button
          className="flex items-center gap-2 rounded-lg border border-energy-500/50 bg-energy-500/10 px-4 py-2 font-display text-sm font-bold text-energy-400 transition-all hover:border-energy-500 hover:bg-energy-500/20"
          onClick={() => setShowDropdown(!showDropdown)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>🦊</span>
          <span>{shortWeb3Address}</span>
          <span className="text-xs">▼</span>
        </motion.button>
        
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-nebula-500/30 bg-void/95 p-2 backdrop-blur-md z-50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="px-3 py-2 border-b border-gray-700 mb-2">
                <p className="text-xs text-gray-500">Web3 Address</p>
                <p className="text-sm text-gray-300 font-mono">{shortWeb3Address}</p>
                {shortChainId && (
                  <>
                    <p className="text-xs text-gray-500 mt-1">Linera Chain</p>
                    <p className="text-sm text-gray-300 font-mono">{shortChainId}</p>
                  </>
                )}
              </div>
              <button
                className="w-full rounded px-3 py-2 text-left font-body text-sm text-gray-300 hover:bg-nebula-500/20 hover:text-white transition-colors"
                onClick={() => {
                  if (shortWeb3Address) {
                    navigator.clipboard.writeText(shortWeb3Address);
                  }
                  setShowDropdown(false);
                }}
              >
                📋 Copy Address
              </button>
              <button
                className="w-full rounded px-3 py-2 text-left font-body text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                onClick={() => {
                  disconnectWallet();
                  setShowDropdown(false);
                }}
              >
                🔌 Disconnect
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.button
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-display text-sm font-bold transition-all ${
        isConnecting 
          ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 cursor-wait'
          : walletError
          ? 'border-red-500/50 bg-red-500/10 text-red-400 hover:border-red-500'
          : 'border-nebula-500/50 bg-nebula-500/10 text-nebula-400 hover:border-nebula-500 hover:bg-nebula-500/20'
      }`}
      onClick={connectWallet}
      disabled={isConnecting}
      whileHover={!isConnecting ? { scale: 1.02 } : {}}
      whileTap={!isConnecting ? { scale: 0.98 } : {}}
    >
      {isConnecting ? (
        <>
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-yellow-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <span>🦊</span>
          <span>Connect</span>
        </>
      )}
    </motion.button>
  );
}

export function ResourceBar() {
  const { resources, resourceRates } = useGameStore();
  const [displayResources, setDisplayResources] = useState(resources);

  // Sync displayResources when resources change (e.g. after building)
  useEffect(() => {
    setDisplayResources(resources);
  }, [resources]);

  // Smooth resource counter animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayResources((prev) => ({
        iron: prev.iron + resourceRates.iron / 60,
        deuterium: prev.deuterium + resourceRates.deuterium / 60,
        crystals: prev.crystals + resourceRates.crystals / 60,
      }));

    }, 1000);
    return () => clearInterval(interval);
  }, [resourceRates]);

  return (
    <div className="relative bg-void/90 backdrop-blur-md border-b border-nebula-500/30">
      {/* Animated top border */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-nebula-500 via-plasma-500 to-energy-500"
        style={{ backgroundSize: '200% 100%' }}
        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo / Empire Name */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="relative flex h-12 w-12 items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-nebula-500/20 to-plasma-500/20"
            animate={{
              boxShadow: [
                '0 0 10px rgba(98, 25, 255, 0.5)',
                '0 0 20px rgba(98, 25, 255, 0.8)',
                '0 0 10px rgba(98, 25, 255, 0.5)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <LogoIcon />
          </motion.div>
          <div>
            <h1 className="font-display text-lg font-bold text-white">DOMINION</h1>
            <p className="font-body text-xs text-gray-400">Empire Management</p>
          </div>
        </motion.div>

        {/* Resource displays */}
        <div className="flex items-center gap-6">
          <ResourceDisplay
            iconSrc="/images/resources/iron.png"
            fallbackIcon="⛏️"
            label="Iron"
            value={displayResources.iron}
            rate={resourceRates.iron}
            color="iron"
            maxValue={100000}
          />
          <ResourceDisplay
            iconSrc="/images/resources/deuterium.png"
            fallbackIcon="🧪"
            label="Deuterium"
            value={displayResources.deuterium}
            rate={resourceRates.deuterium}
            color="deuterium"
            maxValue={50000}
          />
          <ResourceDisplay
            iconSrc="/images/resources/crystals.png"
            fallbackIcon="💎"
            label="Crystals"
            value={displayResources.crystals}
            rate={resourceRates.crystals}
            color="crystals"
            maxValue={25000}
          />
        </div>

        {/* Time, Wallet & Settings */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GameTime />
          <ConnectWalletButton />
          <motion.button
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-nebula-500/30 bg-void/50 text-gray-400 transition-all hover:border-nebula-500 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SettingsIcon />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}

interface ResourceDisplayProps {
  iconSrc: string;
  fallbackIcon: string;
  label: string;
  value: number;
  rate: number;
  color: 'iron' | 'deuterium' | 'crystals';
  maxValue: number;
}

function ResourceDisplay({ iconSrc, fallbackIcon, label, value, rate, color, maxValue }: ResourceDisplayProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const colorClasses = {
    iron: 'from-orange-500 to-orange-400',
    deuterium: 'from-cyan-500 to-cyan-400',
    crystals: 'from-purple-500 to-purple-400',
  };

  const glowColors = {
    iron: 'rgba(249, 115, 22, 0.5)',
    deuterium: 'rgba(6, 182, 212, 0.5)',
    crystals: 'rgba(168, 85, 247, 0.5)',
  };

  return (
    <motion.div
      className="group relative flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Icon with glow */}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-void/50 overflow-hidden"
        animate={{
          boxShadow: [
            `0 0 5px ${glowColors[color]}`,
            `0 0 15px ${glowColors[color]}`,
            `0 0 5px ${glowColors[color]}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <ResourceIcon
          src={iconSrc}
          alt={label}
          fallback={fallbackIcon}
        />
      </motion.div>

      <div className="min-w-[120px]">
        <div className="flex items-baseline justify-between">
          <span className="font-body text-xs uppercase tracking-wider text-gray-400">
            {label}
          </span>
          <motion.span
            className="font-display text-xs text-energy-400"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            +{rate}/h
          </motion.span>
        </div>
        
        <motion.div
          className="font-display text-lg font-bold text-white"
          key={Math.floor(value)}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {Math.floor(value).toLocaleString()}
        </motion.div>

        {/* Progress bar */}
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-800">
          <motion.div
            className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Hover tooltip */}
      <motion.div
        className="absolute -bottom-16 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-void/95 px-3 py-2 font-body text-xs text-gray-300 opacity-0 shadow-lg border border-nebula-500/30 group-hover:opacity-100 transition-opacity"
      >
        <p>Storage: {Math.floor(value).toLocaleString()} / {maxValue.toLocaleString()}</p>
        <p className="text-energy-400">Production: +{rate} per hour</p>
      </motion.div>
    </motion.div>
  );
}

function GameTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-right">
      <p className="font-display text-sm font-bold text-white">
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </p>
      <p className="font-body text-xs text-gray-400">
        Galactic Standard Time
      </p>
    </div>
  );
}
