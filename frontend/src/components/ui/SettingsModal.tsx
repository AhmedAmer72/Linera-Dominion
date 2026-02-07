'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

// Settings state interface
export interface GameSettings {
  soundEffects: boolean;
  music: boolean;
  musicVolume: number;
  notifications: boolean;
  autoSave: boolean;
  showTutorial: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
}

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  soundEffects: true,
  music: true,
  musicVolume: 0.3,
  notifications: true,
  autoSave: true,
  showTutorial: true,
  graphicsQuality: 'high',
};

// Load settings from localStorage
function loadSettings(): GameSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const saved = localStorage.getItem('dominion-settings');
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

// Save settings to localStorage
function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('dominion-settings', JSON.stringify(settings));
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { setGameState, saveCurrentState } = useGameStore();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'general' | 'audio' | 'display'>('general');
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Update a setting
  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);

    // Handle special cases
    if (key === 'music' || key === 'musicVolume') {
      // Dispatch event to BackgroundMusic component
      window.dispatchEvent(new CustomEvent('dominion-music-settings', {
        detail: { music: newSettings.music, volume: newSettings.musicVolume }
      }));
    }
  };

  // Return to main menu
  const handleReturnToMenu = () => {
    // Save current game state first
    saveCurrentState();
    // Then return to menu
    setGameState('menu');
    onClose();
    setShowConfirmExit(false);
  };

  // Toggle switch component
  const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-nebula-500/10">
      <span className="text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
          enabled 
            ? 'bg-gradient-to-r from-nebula-500 to-plasma-500' 
            : 'bg-gray-700'
        }`}
      >
        <motion.div
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg"
          animate={{ left: enabled ? '32px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );

  // Slider component
  const Slider = ({ 
    value, 
    onChange, 
    label, 
    min = 0, 
    max = 1, 
    step = 0.01,
    displayValue 
  }: { 
    value: number; 
    onChange: (v: number) => void; 
    label: string;
    min?: number;
    max?: number;
    step?: number;
    displayValue?: string;
  }) => (
    <div className="py-3 border-b border-nebula-500/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-300">{label}</span>
        <span className="text-sm text-plasma-400">{displayValue || `${Math.round(value * 100)}%`}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none
                 [&::-webkit-slider-thumb]:w-4
                 [&::-webkit-slider-thumb]:h-4
                 [&::-webkit-slider-thumb]:rounded-full
                 [&::-webkit-slider-thumb]:bg-gradient-to-r
                 [&::-webkit-slider-thumb]:from-nebula-500
                 [&::-webkit-slider-thumb]:to-plasma-500
                 [&::-webkit-slider-thumb]:shadow-lg
                 [&::-webkit-slider-thumb]:cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6219ff 0%, #00b8e6 ${value * 100}%, #374151 ${value * 100}%, #374151 100%)`
        }}
      />
    </div>
  );

  // Select component
  const Select = ({ 
    value, 
    onChange, 
    label, 
    options 
  }: { 
    value: string; 
    onChange: (v: string) => void; 
    label: string;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-nebula-500/10">
      <span className="text-gray-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-void border border-nebula-500/30 rounded-lg px-3 py-1.5 text-white text-sm
                 focus:outline-none focus:border-nebula-500 cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg mx-4 overflow-hidden rounded-xl border border-nebula-500/30 bg-void/95 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-nebula-500/30 bg-nebula-500/5">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>Settings</span>
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white text-2xl transition-colors"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-nebula-500/20">
            {(['general', 'audio', 'display'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 font-display text-sm uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-plasma-500 bg-nebula-500/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-nebula-500/5'
                }`}
              >
                {tab === 'general' && '🎮 '}
                {tab === 'audio' && '🔊 '}
                {tab === 'display' && '🖥️ '}
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 max-h-[400px] overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-1">
                <Toggle
                  label="Notifications"
                  enabled={settings.notifications}
                  onChange={(v) => updateSetting('notifications', v)}
                />
                <Toggle
                  label="Auto-Save"
                  enabled={settings.autoSave}
                  onChange={(v) => updateSetting('autoSave', v)}
                />
                <Toggle
                  label="Show Tutorial Tips"
                  enabled={settings.showTutorial}
                  onChange={(v) => updateSetting('showTutorial', v)}
                />

                {/* Divider */}
                <div className="py-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-nebula-500/30 to-transparent" />
                </div>

                {/* Game Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-display text-gray-400 uppercase tracking-wider mb-3">
                    Game Actions
                  </h3>
                  
                  <button
                    onClick={() => setShowConfirmExit(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-nebula-500/30 
                             bg-nebula-500/10 text-gray-300 hover:bg-nebula-500/20 hover:text-white 
                             hover:border-nebula-500/50 transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">🏠</span>
                      <span>Return to Main Menu</span>
                    </span>
                    <span className="text-gray-500 group-hover:text-gray-300">→</span>
                  </button>

                  <button
                    onClick={() => {
                      saveCurrentState();
                      // Show confirmation (could add a toast here)
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-energy-500/30 
                             bg-energy-500/10 text-energy-300 hover:bg-energy-500/20 
                             hover:border-energy-500/50 transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">💾</span>
                      <span>Save Game</span>
                    </span>
                    <span className="text-energy-500/50 group-hover:text-energy-300">→</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-1">
                <Toggle
                  label="Music"
                  enabled={settings.music}
                  onChange={(v) => updateSetting('music', v)}
                />
                <Slider
                  label="Music Volume"
                  value={settings.musicVolume}
                  onChange={(v) => updateSetting('musicVolume', v)}
                />
                <Toggle
                  label="Sound Effects"
                  enabled={settings.soundEffects}
                  onChange={(v) => updateSetting('soundEffects', v)}
                />
                
                <div className="mt-4 p-3 rounded-lg bg-plasma-500/10 border border-plasma-500/20">
                  <p className="text-xs text-plasma-400">
                    💡 Tip: Click the music icon (🎵) in the bottom-right corner to quickly toggle music playback.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-1">
                <Select
                  label="Graphics Quality"
                  value={settings.graphicsQuality}
                  onChange={(v) => updateSetting('graphicsQuality', v as 'low' | 'medium' | 'high')}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                />
                
                <div className="mt-4 p-3 rounded-lg bg-nebula-500/10 border border-nebula-500/20">
                  <p className="text-xs text-gray-400">
                    📊 Lower graphics settings may improve performance on older devices.
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-nebula-500/20">
                  <h4 className="text-sm font-display text-gray-400 uppercase tracking-wider mb-3">
                    Game Info
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Version</span>
                      <span className="text-gray-300">0.1.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Network</span>
                      <span className="text-plasma-400">Conway Testnet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Built with</span>
                      <span className="text-gray-300">Linera SDK</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-nebula-500/20 bg-void/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-display text-sm font-bold
                       bg-gradient-to-r from-nebula-500 to-plasma-500 text-white
                       hover:from-nebula-400 hover:to-plasma-400 transition-all
                       shadow-lg shadow-nebula-500/25"
            >
              Done
            </button>
          </div>
        </motion.div>

        {/* Confirm Exit Modal */}
        <AnimatePresence>
          {showConfirmExit && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmExit(false)}
            >
              <motion.div
                className="w-full max-w-sm mx-4 p-6 rounded-xl border border-amber-500/30 bg-void/95"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <span className="text-4xl mb-4 block">⚠️</span>
                  <h3 className="font-display text-xl font-bold text-white mb-2">
                    Return to Main Menu?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Your progress will be saved automatically.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmExit(false)}
                    className="flex-1 py-2.5 rounded-lg font-display text-sm font-bold
                             border border-gray-600 text-gray-300 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReturnToMenu}
                    className="flex-1 py-2.5 rounded-lg font-display text-sm font-bold
                             bg-gradient-to-r from-amber-500 to-orange-500 text-white
                             hover:from-amber-400 hover:to-orange-400 transition-all"
                  >
                    Exit to Menu
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

export default SettingsModal;
