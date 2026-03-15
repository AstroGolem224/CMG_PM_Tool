/** Settings placeholder page with app info */
import { motion } from 'framer-motion';
import { Info, Github, Server } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Info size={20} className="text-primary-400" />
          <h2 className="text-lg font-semibold text-white">About CMG PM Tool</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03]">
            <Server size={16} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-300">Version</p>
              <p className="text-xs text-gray-500">1.0.0</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03]">
            <Github size={16} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-300">Stack</p>
              <p className="text-xs text-gray-500">React + TypeScript + Vite / FastAPI + SQLite</p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.03]">
            <p className="text-sm text-gray-300 mb-1">Description</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A modular, self-hosted Project Management Web Application designed for LAN environments.
              Features Kanban boards, task tracking, labels, comments, and a dashboard — built for
              speed, security, and a polished UI/UX.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
