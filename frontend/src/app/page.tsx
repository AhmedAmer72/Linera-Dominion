'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MainMenu } from '@/components/ui/MainMenu';
import { GameHUD } from '@/components/game/GameHUD';
import { useGameStore } from '@/store/gameStore';

// Dynamically import SpaceScene to avoid SSR issues with Three.js
const SpaceScene = dynamic(
  () => import('@/components/three/SpaceScene').then((mod) => mod.SpaceScene),
  { ssr: false, loading: () => null }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { gameState, initializeGame } = useGameStore();

  useEffect(() => {
    setMounted(true);
    // Simulate loading assets
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('Loading complete, isLoading:', false, 'gameState:', gameState);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('State changed - isLoading:', isLoading, 'gameState:', gameState, 'mounted:', mounted);
  }, [isLoading, gameState, mounted]);

  if (!mounted) {
    return null;
  }

  // Determine which screen to show
  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen key="loading" />;
    }
    if (gameState === 'menu') {
      console.log('Rendering MainMenu');
      return <MainMenu key="menu" onStart={initializeGame} />;
    }
    return <GameHUD key="game" />;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      {/* 3D Space Background - behind everything */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <SpaceScene />
      </div>

      {/* UI Layer - above the 3D scene */}
      {renderContent()}
    </main>
  );
}
