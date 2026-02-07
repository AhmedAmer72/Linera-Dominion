'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Music control component with sleek space-themed design
export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);

  // Space ambient tracks - add your music files to /public/audio/
  const tracks = [
    { name: 'Space Ambient', file: '/audio/space.mp3' },
  ];

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio(tracks[currentTrack].file);
    audioRef.current.loop = true;
    audioRef.current.volume = volume;
    
    audioRef.current.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
    });

    audioRef.current.addEventListener('error', () => {
      console.log('Audio file not found. Add music files to /public/audio/');
      setIsLoaded(false);
    });

    // Load saved preferences
    const savedVolume = localStorage.getItem('dominion-music-volume');
    const savedPlaying = localStorage.getItem('dominion-music-playing');
    
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
      audioRef.current.volume = parseFloat(savedVolume);
    }
    
    if (savedPlaying === 'true') {
      // Auto-play requires user interaction first, so we just set the state
      setIsPlaying(false);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle track changes
  useEffect(() => {
    if (audioRef.current && isLoaded) {
      const wasPlaying = isPlaying;
      audioRef.current.pause();
      audioRef.current.src = tracks[currentTrack].file;
      audioRef.current.load();
      if (wasPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrack]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      localStorage.setItem('dominion-music-volume', volume.toString());
    }
  }, [volume]);

  // Listen for settings changes from SettingsModal
  useEffect(() => {
    const handleSettingsChange = (event: CustomEvent<{ music: boolean; volume: number }>) => {
      const { music, volume: newVolume } = event.detail;
      
      // Update volume
      setVolume(newVolume);
      
      // Handle music toggle
      if (music && !isPlaying && audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else if (!music && isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('dominion-music-settings', handleSettingsChange as EventListener);
    return () => {
      window.removeEventListener('dominion-music-settings', handleSettingsChange as EventListener);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('dominion-music-playing', 'false');
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('dominion-music-playing', 'true');
        })
        .catch((err) => {
          console.log('Playback failed:', err);
        });
    }
  }, [isPlaying]);

  const nextTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
  }, [tracks.length]);

  const prevTrack = useCallback(() => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  return (
    <div className="fixed bottom-20 right-4 z-[60]">
      {/* Expanded Controls Panel */}
      {showControls && (
        <div 
          className="absolute bottom-14 right-0 w-64 p-4 rounded-lg 
                     bg-void/90 backdrop-blur-xl border border-nebula-primary/30
                     shadow-lg shadow-nebula-primary/20 animate-fade-in"
        >
          {/* Track Info */}
          <div className="mb-4">
            <div className="text-xs text-plasma-primary/70 uppercase tracking-wider mb-1">
              Now Playing
            </div>
            <div className="text-sm font-orbitron text-white truncate">
              {tracks[currentTrack].name}
            </div>
          </div>

          {/* Track Navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={prevTrack}
              className="p-2 rounded-full hover:bg-nebula-primary/20 
                       text-plasma-primary transition-colors"
              title="Previous Track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
            
            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-nebula-primary/30 hover:bg-nebula-primary/50
                       text-white transition-all transform hover:scale-105
                       border border-nebula-primary/50"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            
            <button
              onClick={nextTrack}
              className="p-2 rounded-full hover:bg-nebula-primary/20 
                       text-plasma-primary transition-colors"
              title="Next Track"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-3">
            <svg 
              className="w-4 h-4 text-plasma-primary/70 flex-shrink-0" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              {volume === 0 ? (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              ) : volume < 0.5 ? (
                <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
              ) : (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              )}
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-void rounded-full appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-3
                       [&::-webkit-slider-thumb]:h-3
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-plasma-primary
                       [&::-webkit-slider-thumb]:shadow-glow-plasma
                       [&::-webkit-slider-track]:bg-nebula-primary/30
                       [&::-webkit-slider-track]:rounded-full"
              style={{
                background: `linear-gradient(to right, #00b8e6 0%, #00b8e6 ${volume * 100}%, rgba(98, 25, 255, 0.3) ${volume * 100}%, rgba(98, 25, 255, 0.3) 100%)`
              }}
            />
            <span className="text-xs text-plasma-primary/70 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Instructions if no audio */}
          {!isLoaded && (
            <div className="mt-4 p-2 rounded bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-400">
                Add MP3 files to <code className="text-amber-300">/public/audio/</code>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setShowControls(!showControls)}
        className={`
          group relative p-3 rounded-full transition-all duration-300
          ${showControls 
            ? 'bg-nebula-primary/40 border-nebula-primary' 
            : 'bg-void/80 border-nebula-primary/30 hover:border-nebula-primary/60'
          }
          border backdrop-blur-sm
          shadow-lg hover:shadow-nebula-primary/30
        `}
        title="Music Controls"
      >
        {/* Animated rings when playing */}
        {isPlaying && (
          <>
            <span className="absolute inset-0 rounded-full border border-plasma-primary/50 animate-ping" />
            <span className="absolute inset-[-4px] rounded-full border border-nebula-primary/30 animate-pulse" />
          </>
        )}
        
        {/* Music Icon */}
        <svg 
          className={`w-5 h-5 transition-colors ${isPlaying ? 'text-plasma-primary' : 'text-white/70 group-hover:text-white'}`}
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>

        {/* Playing indicator dot */}
        {isPlaying && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-energy-primary rounded-full animate-pulse" />
        )}
      </button>
    </div>
  );
}

export default BackgroundMusic;
