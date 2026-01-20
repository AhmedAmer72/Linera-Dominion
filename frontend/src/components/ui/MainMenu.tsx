'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';

// Logo component with fallback
function LogoWithFallback() {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return (
      <div className="flex flex-col items-center">
        <h1 className="font-display text-7xl font-black tracking-wider md:text-8xl">
          <span className="bg-gradient-to-r from-nebula-300 via-nebula-500 to-nebula-300 bg-clip-text text-transparent">
            LINERA
          </span>
        </h1>
        <h2 className="font-display text-5xl font-bold tracking-[0.5em] md:text-6xl">
          <span className="bg-gradient-to-r from-plasma-300 via-energy-400 to-plasma-300 bg-clip-text text-transparent">
            DOMINION
          </span>
        </h2>
      </div>
    );
  }
  
  return (
    <Image
      src="/images/logo.png"
      alt="Linera Dominion"
      width={350}
      height={350}
      className="object-contain drop-shadow-[0_0_30px_rgba(98,25,255,0.5)]"
      onError={() => setImgError(true)}
      priority
    />
  );
}

interface MainMenuProps {
  onStart: () => void;
}

// Menu icon component with fallback
function MenuIcon({ src, fallback }: { src: string; fallback: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-2xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt="Menu"
      width={56}
      height={56}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// Settings Modal
function SettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="holo-panel w-full max-w-md p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">⚙️ Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Sound Effects</span>
            <button className="rounded bg-nebula-500/20 px-3 py-1 text-nebula-300">On</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Music</span>
            <button className="rounded bg-nebula-500/20 px-3 py-1 text-nebula-300">On</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Notifications</span>
            <button className="rounded bg-nebula-500/20 px-3 py-1 text-nebula-300">On</button>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">More settings coming soon</p>
      </motion.div>
    </motion.div>
  );
}

// About Modal
function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="holo-panel w-full max-w-md p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-white">ℹ️ About</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div className="space-y-4 text-gray-300">
          <p>
            <strong className="text-white">Linera Dominion</strong> is a blockchain-powered 
            MMORTS (Massively Multiplayer Online Real-Time Strategy) game built on the Linera protocol.
          </p>
          <p>
            Build your empire, research technologies, command fleets, and conquer the galaxy!
          </p>
          <div className="rounded bg-void/50 p-3">
            <p className="text-sm"><strong>Version:</strong> 0.1.0</p>
            <p className="text-sm"><strong>Network:</strong> Conway Testnet</p>
            <p className="text-sm"><strong>Built with:</strong> Linera SDK, Next.js, Rust</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const menuItems = [
  { id: 'start', label: 'LAUNCH GAME', icon: '🚀', iconSrc: '/images/ships/scout.png' },
  { id: 'settings', label: 'SETTINGS', icon: '⚙️', iconSrc: '/images/research/physics.png' },
  { id: 'about', label: 'ABOUT', icon: 'ℹ️', iconSrc: '/images/research/genetics.png' },
];

export function MainMenu({ onStart }: MainMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [modal, setModal] = useState<'settings' | 'about' | null>(null);
  const { connected, shortChainId, isConnecting, connectWallet, disconnectWallet, restoreConnection } = useWallet();

  // Restore connection on mount
  useEffect(() => {
    restoreConnection();
  }, [restoreConnection]);

  const handleMenuClick = (id: string) => {
    switch (id) {
      case 'start':
        onStart();
        break;
      case 'settings':
        setModal('settings');
        break;
      case 'about':
        setModal('about');
        break;
    }
  };

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
        {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}
      </AnimatePresence>

      <motion.div
        className="fixed inset-0 flex flex-col items-center justify-center"
        style={{ zIndex: 100 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
      {/* Connect Wallet Button - Top Right */}
      <motion.div
        className="absolute top-6 right-6 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {connected && shortChainId ? (
          <motion.button
            className="flex items-center gap-3 rounded-xl border border-energy-500/50 bg-energy-500/10 px-5 py-3 font-display text-sm font-bold text-energy-400 backdrop-blur-sm transition-all hover:border-energy-500 hover:bg-energy-500/20"
            onClick={disconnectWallet}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-energy-500 animate-pulse" />
            <span>{shortChainId}</span>
          </motion.button>
        ) : (
          <motion.button
            className={`flex items-center gap-3 rounded-xl border px-5 py-3 font-display text-sm font-bold backdrop-blur-sm transition-all ${
              isConnecting 
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400 cursor-wait'
                : 'border-nebula-500/50 bg-nebula-500/10 text-nebula-300 hover:border-nebula-400 hover:bg-nebula-500/20 hover:text-white'
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
                <span className="text-lg">🔗</span>
                <span>Connect Wallet</span>
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* Logo */}
      <motion.div
        className="relative mb-8 flex flex-col items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {/* Glowing background - static */}
        <div
          className="absolute inset-0 -z-10 blur-3xl opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(98, 25, 255, 0.4) 0%, transparent 70%)',
          }}
        />
        
        {/* Logo Image */}
        <div className="relative flex items-center justify-center">
          <LogoWithFallback />
        </div>
        
        {/* Subtitle */}
        <motion.p
          className="mt-6 text-center font-body text-lg text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Conquer the Galaxy • Build Your Empire • Forge Alliances
        </motion.p>
      </motion.div>

      {/* Menu items */}
      <motion.div
        className="flex flex-col gap-4"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            className="group relative overflow-hidden"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
            onHoverStart={() => setHoveredItem(item.id)}
            onHoverEnd={() => setHoveredItem(null)}
            onClick={() => handleMenuClick(item.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button background */}
            <div className="holo-panel relative flex min-w-[300px] items-center gap-4 px-8 py-4">
              {/* Hover gradient */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-nebula-500/20 to-plasma-500/20"
                initial={{ opacity: 0, x: '-100%' }}
                animate={{
                  opacity: hoveredItem === item.id ? 1 : 0,
                  x: hoveredItem === item.id ? '0%' : '-100%',
                }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Icon */}
              <motion.div
                className="relative z-10 flex items-center justify-center"
                animate={{
                  rotate: hoveredItem === item.id ? [0, -10, 10, 0] : 0,
                  scale: hoveredItem === item.id ? 1.2 : 1,
                }}
                transition={{ duration: 0.4 }}
              >
                <MenuIcon src={item.iconSrc} fallback={item.icon} />
              </motion.div>
              
              {/* Label */}
              <span className="relative z-10 font-display text-lg font-bold tracking-wider text-white">
                {item.label}
              </span>
              
              {/* Arrow indicator */}
              <motion.span
                className="relative z-10 ml-auto text-nebula-400"
                animate={{
                  x: hoveredItem === item.id ? [0, 5, 0] : 0,
                  opacity: hoveredItem === item.id ? 1 : 0.3,
                }}
                transition={{ duration: 0.5, repeat: hoveredItem === item.id ? Infinity : 0 }}
              >
                ▶
              </motion.span>
              
              {/* Corner decorations */}
              <div className="absolute left-0 top-0 h-2 w-2 border-l-2 border-t-2 border-nebula-500" />
              <div className="absolute bottom-0 right-0 h-2 w-2 border-b-2 border-r-2 border-nebula-500" />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Version info */}
      <motion.div
        className="absolute bottom-8 left-8 font-body text-sm text-gray-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <p>Version 0.1.0 • Built on Linera</p>
      </motion.div>

      {/* Network status */}
      <motion.div
        className="absolute bottom-8 right-8 flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="h-2 w-2 rounded-full bg-energy-500 animate-pulse" />
        <span className="font-body text-sm text-gray-400">Testnet Connected</span>
      </motion.div>

      {/* Decorative elements - static for performance */}
      <div
        className="absolute left-0 top-0 h-40 w-40 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, #6219ff 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 h-60 w-60 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, #00b8e6 0%, transparent 70%)',
        }}
      />
    </motion.div>
    </>
  );
}


