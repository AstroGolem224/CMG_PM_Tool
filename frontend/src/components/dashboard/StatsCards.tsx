/** Grid of stat cards displaying key project metrics */
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, ListTodo, AlertTriangle } from 'lucide-react';
import type { DashboardStats } from '@/types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const cards = [
  {
    key: 'total_tasks' as const,
    label: 'Total Tasks',
    hint: 'all lanes',
    icon: ListTodo,
  },
  {
    key: 'in_progress' as const,
    label: 'In Progress',
    hint: 'active throughput',
    icon: Clock,
  },
  {
    key: 'completed' as const,
    label: 'Completed',
    hint: 'done state',
    icon: CheckCircle2,
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    hint: 'requires action',
    icon: AlertTriangle,
  },
];

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, hint, icon: Icon }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="glass p-5"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
                {label}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
            </div>
            <span className="rounded-lg border border-[var(--glass-border-hot)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] p-2 text-[var(--accent-primary)]">
              <Icon size={18} />
            </span>
          </div>
          <p className="font-display text-4xl uppercase tracking-[0.08em] text-[var(--accent-gold)]">
            {loading ? (
              <span className="inline-block h-8 w-10 animate-pulse rounded bg-white/10" />
            ) : (
              stats?.[key] ?? 0
            )}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
