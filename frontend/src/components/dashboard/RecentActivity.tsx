/** Timeline feed of recent task activity */
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import type { ActivityItem } from '@/types';

interface RecentActivityProps {
  activities: ActivityItem[];
  loading: boolean;
}

export default function RecentActivity({ activities, loading }: RecentActivityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-[var(--accent-primary)]" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            telemetry
          </p>
          <h3 className="panel-heading text-base">Recent Activity</h3>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="py-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          no recent activity
        </p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-[var(--glass-border-hot)]" />

          <div className="space-y-3">
            {activities.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 relative"
              >
                <span className="z-10 mt-0.5 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-[var(--glass-border-hot)] bg-[var(--bg-base)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{item.task_title}</span>
                    {' '}
                    <span className="text-[var(--text-muted)]">{item.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                      {item.project_name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">&middot;</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
