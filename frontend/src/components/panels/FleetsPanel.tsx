'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { useState } from 'react';
import Image from 'next/image';

// Ship icon component with fallback
function ShipIcon({ src, fallback, name, size = 72 }: { src: string; fallback: string; name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-2xl">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

// Resource cost icon with fallback
function ResourceCostIcon({ src, fallback }: { src: string; fallback: string }) {
  const [imgError, setImgError] = useState(false);
  
  if (imgError) {
    return <span className="text-sm">{fallback}</span>;
  }
  
  return (
    <Image
      src={src}
      alt="Resource"
      width={32}
      height={32}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

const shipTypes = [
  { type: 'Scout', icon: '🛸', iconSrc: '/images/ships/scout.png', attack: 10, defense: 5, speed: 100, cargo: 50, cost: { iron: 100, deuterium: 50, crystals: 0 } },
  { type: 'Fighter', icon: '✈️', iconSrc: '/images/ships/scout.png', attack: 50, defense: 25, speed: 80, cargo: 20, cost: { iron: 200, deuterium: 100, crystals: 10 } },
  { type: 'Cruiser', icon: '🚀', iconSrc: '/images/ships/battlecruiser.png', attack: 150, defense: 100, speed: 50, cargo: 100, cost: { iron: 500, deuterium: 250, crystals: 50 } },
  { type: 'Battleship', icon: '🛳️', iconSrc: '/images/ships/battlecruiser.png', attack: 400, defense: 300, speed: 30, cargo: 200, cost: { iron: 1500, deuterium: 750, crystals: 150 } },
  { type: 'Carrier', icon: '🚢', iconSrc: '/images/ships/carrier.png', attack: 100, defense: 500, speed: 20, cargo: 1000, cost: { iron: 2000, deuterium: 1000, crystals: 200 } },
  { type: 'Dreadnought', icon: '⚔️', iconSrc: '/images/ships/dreadnought.png', attack: 800, defense: 600, speed: 15, cargo: 500, cost: { iron: 5000, deuterium: 2500, crystals: 500 } },
];

export function FleetsPanel() {
  const { fleets, selectFleet, selectedFleetId } = useGameStore();
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const selectedFleet = fleets.find(f => f.id === selectedFleetId);

  return (
    <div className="holo-panel flex h-full flex-col overflow-hidden p-6">
      {/* Header */}
      <motion.div
        className="mb-6 flex flex-shrink-0 items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h2 className="font-display text-3xl font-bold text-white">
            Fleet Command
          </h2>
          <p className="mt-1 font-body text-gray-400">
            Manage your armada across the galaxy
          </p>
        </div>
        <motion.button
          className="btn-primary flex items-center gap-2"
          onClick={() => setShowBuildModal(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span>➕</span>
          <span>Create Fleet</span>
        </motion.button>
      </motion.div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Fleet List */}
        <motion.div
          className="w-1/3 flex-shrink-0 overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
            Active Fleets
          </h3>
          <div className="space-y-3">
            {fleets.map((fleet, i) => (
              <motion.div
                key={fleet.id}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedFleetId === fleet.id
                    ? 'border-plasma-500 bg-plasma-500/10'
                    : 'border-gray-700 bg-void/50 hover:border-plasma-500/50'
                }`}
                onClick={() => selectFleet(fleet.id)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-plasma-500/20 to-energy-500/20 overflow-hidden"
                      animate={fleet.status === 'moving' ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <ShipIcon src="/images/ships/scout.png" fallback="🚀" name="Fleet" size={28} />
                    </motion.div>
                    <div>
                      <h4 className="font-display font-bold text-white">{fleet.name}</h4>
                      <p className="font-body text-xs text-gray-400">
                        {fleet.ships.reduce((acc, s) => acc + s.quantity, 0)} ships
                      </p>
                    </div>
                  </div>
                  <FleetStatusBadge status={fleet.status} />
                </div>
                
                {/* Ship composition preview */}
                <div className="mt-3 flex gap-2">
                  {fleet.ships.slice(0, 4).map((ship, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded bg-void/50 px-2 py-1"
                    >
                      <div className="w-4 h-4">
                        <ShipIcon 
                          src={shipTypes.find(s => s.type === ship.type)?.iconSrc || '/images/ships/scout.png'} 
                          fallback={shipTypes.find(s => s.type === ship.type)?.icon || '🚀'} 
                          name={ship.type}
                          size={16}
                        />
                      </div>
                      <span className="font-display text-xs text-gray-300">
                        {ship.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Fleet Details */}
        <motion.div
          className="flex-1 overflow-y-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {selectedFleet ? (
            <FleetDetails fleet={selectedFleet} onDeploy={() => setShowDeployModal(true)} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <motion.div
                  className="mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ShipIcon src="/images/ships/dreadnought.png" fallback="🚀" name="Fleet" size={80} />
                </motion.div>
                <p className="font-display text-xl text-gray-400">Select a fleet to view details</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Build Modal */}
      <AnimatePresence>
        {showBuildModal && (
          <BuildShipsModal onClose={() => setShowBuildModal(false)} />
        )}
        {showDeployModal && selectedFleet && (
          <DeployFleetModal fleet={selectedFleet} onClose={() => setShowDeployModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FleetDetails({ fleet, onDeploy }: { fleet: any; onDeploy: () => void }) {
  const totalAttack = fleet.ships.reduce((acc: number, s: any) => {
    const shipData = shipTypes.find(st => st.type === s.type);
    return acc + (shipData?.attack || 0) * s.quantity;
  }, 0);

  const totalDefense = fleet.ships.reduce((acc: number, s: any) => {
    const shipData = shipTypes.find(st => st.type === s.type);
    return acc + (shipData?.defense || 0) * s.quantity;
  }, 0);

  const totalCargo = fleet.ships.reduce((acc: number, s: any) => {
    const shipData = shipTypes.find(st => st.type === s.type);
    return acc + (shipData?.cargo || 0) * s.quantity;
  }, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-bold text-white">{fleet.name}</h3>
          <p className="font-body text-gray-400">Position: ({fleet.x}, {fleet.y})</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            className="rounded-lg border border-plasma-500 px-4 py-2 font-display text-sm font-bold text-plasma-400 transition-all hover:bg-plasma-500/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDeploy}
          >
            Deploy
          </motion.button>
          <motion.button
            className="rounded-lg border border-energy-500 px-4 py-2 font-display text-sm font-bold text-energy-400 transition-all hover:bg-energy-500/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Add Ships
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard icon="⚔️" label="Attack Power" value={totalAttack} color="red" />
        <StatCard icon="🛡️" label="Defense" value={totalDefense} color="blue" />
        <StatCard icon="📦" label="Cargo Space" value={totalCargo} color="green" />
      </div>

      {/* Ship Composition */}
      <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-gray-400">
        Ship Composition
      </h4>
      <div className="grid gap-3 md:grid-cols-2">
        {fleet.ships.map((ship: any, i: number) => {
          const shipData = shipTypes.find(s => s.type === ship.type);
          return (
            <motion.div
              key={i}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-void/50 p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-plasma-500/20 to-energy-500/20">
                  <span className="text-xl">{shipData?.icon}</span>
                </div>
                <div>
                  <p className="font-display font-bold text-white">{ship.type}</p>
                  <p className="font-body text-xs text-gray-400">
                    ATK: {shipData?.attack} | DEF: {shipData?.defense}
                  </p>
                </div>
              </div>
              <span className="font-display text-2xl font-bold text-plasma-400">
                x{ship.quantity}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const colors = {
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30',
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-4 ${colors[color as keyof typeof colors]}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="font-body text-sm text-gray-400">{label}</span>
      </div>
      <motion.p
        className="mt-2 font-display text-2xl font-bold text-white"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {value.toLocaleString()}
      </motion.p>
    </div>
  );
}

function FleetStatusBadge({ status }: { status: string }) {
  const styles = {
    idle: 'bg-energy-500/20 text-energy-400 border-energy-500/30',
    moving: 'bg-plasma-500/20 text-plasma-400 border-plasma-500/30',
    combat: 'bg-red-500/20 text-red-400 border-red-500/30',
    docked: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <motion.span
      className={`rounded-full border px-2 py-1 font-display text-xs font-bold uppercase ${styles[status as keyof typeof styles]}`}
      animate={status === 'moving' ? { opacity: [1, 0.5, 1] } : {}}
      transition={{ duration: 1, repeat: Infinity }}
    >
      {status}
    </motion.span>
  );
}

function BuildShipsModal({ onClose }: { onClose: () => void }) {
  const { buildShips, fleets } = useGameStore();
  const [shipCounts, setShipCounts] = useState<Record<string, number>>({});
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuildShips = async () => {
    const shipsToAdd = Object.entries(shipCounts)
      .filter(([, count]) => count > 0)
      .map(([type, quantity]) => ({ type, quantity }));
    
    if (shipsToAdd.length === 0) return;
    
    setIsBuilding(true);
    try {
      // Get first fleet id or use 1 as default
      const fleetId = fleets[0]?.id || 1;
      await buildShips(fleetId, shipsToAdd);
      console.log('✅ Ships queued for construction');
      onClose();
    } catch (error) {
      console.error('❌ Ship build failed:', error);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="holo-panel max-h-[80vh] w-full max-w-2xl overflow-y-auto p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-6 font-display text-2xl font-bold text-white">Build Ships</h3>
        
        <div className="space-y-4">
          {shipTypes.map((ship) => (
            <div
              key={ship.type}
              className="flex items-center justify-between rounded-lg border border-gray-700 bg-void/50 p-4"
            >
              <div className="flex items-center gap-3">
                <ShipIcon src={ship.iconSrc} fallback={ship.icon} name={ship.type} size={32} />
                <div>
                  <p className="font-display font-bold text-white">{ship.type}</p>
                  <p className="font-body text-xs text-gray-400">
                    ATK: {ship.attack} | DEF: {ship.defense} | SPD: {ship.speed}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <ResourceCostIcon src="/images/resources/iron.png" fallback="⛏️" />
                  <span className="font-display text-xs text-gray-300">{ship.cost.iron}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={shipCounts[ship.type] || 0}
                  onChange={(e) => setShipCounts({ ...shipCounts, [ship.type]: parseInt(e.target.value) || 0 })}
                  className="w-20 rounded border border-gray-700 bg-void px-3 py-2 font-display text-white"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <motion.button
            className="rounded-lg border border-gray-600 px-6 py-2 font-display font-bold text-gray-400 hover:border-gray-400 hover:text-white"
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            disabled={isBuilding}
          >
            Cancel
          </motion.button>
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            onClick={handleBuildShips}
            disabled={isBuilding}
          >
            {isBuilding ? 'Building...' : 'Build Ships'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DeployFleetModal({ fleet, onClose }: { fleet: any; onClose: () => void }) {
  const { sendFleet } = useGameStore();
  const [destX, setDestX] = useState('');
  const [destY, setDestY] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleDeploy = async () => {
    const x = parseInt(destX);
    const y = parseInt(destY);
    if (isNaN(x) || isNaN(y)) return;
    
    setIsSending(true);
    try {
      await sendFleet(fleet.id, x, y);
      console.log('✅ Fleet deployed');
      onClose();
    } catch (error) {
      console.error('❌ Fleet deployment failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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
        <h3 className="mb-6 font-display text-2xl font-bold text-white">
          Deploy {fleet.name}
        </h3>
        
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block font-body text-sm text-gray-400">Destination X</label>
            <input
              type="number"
              value={destX}
              onChange={(e) => setDestX(e.target.value)}
              className="w-full rounded border border-gray-700 bg-void px-4 py-3 font-display text-white"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block font-body text-sm text-gray-400">Destination Y</label>
            <input
              type="number"
              value={destY}
              onChange={(e) => setDestY(e.target.value)}
              className="w-full rounded border border-gray-700 bg-void px-4 py-3 font-display text-white"
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <motion.button
            className="rounded-lg border border-gray-600 px-6 py-2 font-display font-bold text-gray-400"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </motion.button>
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.02 }}
            onClick={handleDeploy}
            disabled={isSending || !destX || !destY}
          >
            {isSending ? 'Deploying...' : 'Launch Fleet'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
