'use client';

import { motion } from 'framer-motion';

export function DiplomacyPanel() {
  const alliances = [
    { id: 1, name: 'Galactic Federation', members: 24, status: 'allied' },
    { id: 2, name: 'Nova Empire', members: 18, status: 'neutral' },
    { id: 3, name: 'Void Collective', members: 12, status: 'hostile' },
  ];

  return (
    <div className="holo-panel h-full overflow-hidden p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-white">
          🤝 Diplomacy
        </h2>
        <span className="rounded bg-nebula-500/20 px-3 py-1 text-sm text-nebula-300">
          Coming Soon
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-gray-400">
          Forge alliances, negotiate treaties, and manage diplomatic relations with other empires.
        </p>

        <div className="grid gap-4">
          {alliances.map((alliance, i) => (
            <motion.div
              key={alliance.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-lg border p-4 ${
                alliance.status === 'allied'
                  ? 'border-energy-500/30 bg-energy-500/10'
                  : alliance.status === 'hostile'
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-gray-600/30 bg-gray-600/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-white">{alliance.name}</h3>
                  <p className="text-sm text-gray-400">{alliance.members} members</p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-xs font-bold uppercase ${
                    alliance.status === 'allied'
                      ? 'bg-energy-500/20 text-energy-400'
                      : alliance.status === 'hostile'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {alliance.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-nebula-500/30 bg-nebula-500/5 p-4 text-center">
          <p className="text-nebula-300">
            Diplomacy features are under development. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}
