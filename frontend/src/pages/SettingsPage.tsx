import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Info, Server, Wifi } from 'lucide-react';
import { metaApi } from '@/api/meta';
import ErrorBanner from '@/components/common/ErrorBanner';
import { formatDate } from '@/lib/utils';
import type { RuntimeInfo } from '@/types';

export default function SettingsPage() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    metaApi
      .getRuntime()
      .then(setRuntime)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="max-w-3xl space-y-4">
      {error && <ErrorBanner message={error} />}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <Info size={20} className="text-[var(--accent-primary)]" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
              // runtime manifest
            </p>
            <h2 className="panel-heading mt-1">About CMG PM Tool</h2>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface-subtle flex items-center gap-3 p-3">
            <Server size={16} className="text-[var(--accent-primary)]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Version</p>
              <p className="text-xs text-[var(--text-primary)]">{runtime?.version ?? 'Loading...'}</p>
            </div>
          </div>

          <div className="surface-subtle flex items-center gap-3 p-3">
            <Wifi size={16} className="text-[var(--accent-primary)]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">API Base</p>
              <p className="text-xs text-[var(--text-primary)]">
                {runtime?.api_base ?? 'Waiting for backend...'}
              </p>
            </div>
          </div>

          <div className="surface-subtle flex items-center gap-3 p-3">
            <Database size={16} className="text-[var(--accent-primary)]" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Database</p>
              <p className="break-all text-xs text-[var(--text-primary)]">
                {runtime?.database_path ?? 'Not available'}
              </p>
            </div>
          </div>

          <div className="surface-subtle p-3">
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Description</p>
            <p className="text-xs leading-relaxed text-[var(--text-primary)]">
              A modular, self-hosted project management web application designed for LAN
              environments. It ships with kanban boards, task tracking, labels, comments, and a
              dashboard backed by a real API instead of placeholder data.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="surface-subtle p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Environment</p>
              <p className="mt-1 text-xs text-[var(--text-primary)]">{runtime?.environment ?? 'Unknown'}</p>
            </div>
            <div className="surface-subtle p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Demo Seed</p>
              <p className="mt-1 text-xs text-[var(--text-primary)]">
                {runtime ? (runtime.seeded_demo ? 'Enabled' : 'Disabled') : 'Unknown'}
              </p>
            </div>
            <div className="surface-subtle p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Frontend Origin</p>
              <p className="mt-1 break-all text-xs text-[var(--text-primary)]">
                {runtime?.frontend_origin ?? 'Unknown'}
              </p>
            </div>
            <div className="surface-subtle p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">Runtime Clock</p>
              <p className="mt-1 text-xs text-[var(--text-primary)]">
                {runtime ? formatDate(runtime.current_time) : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
