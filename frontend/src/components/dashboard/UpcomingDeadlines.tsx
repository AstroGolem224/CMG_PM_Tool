/** List of tasks with deadlines in the next 7 days */
import { motion } from 'framer-motion';
import { Calendar, ArrowRight } from 'lucide-react';
import { cn, priorityColors, formatDate } from '@/lib/utils';
import type { DeadlineItem } from '@/types';

interface UpcomingDeadlinesProps {
  deadlines: DeadlineItem[];
  loading: boolean;
}

export default function UpcomingDeadlines({ deadlines, loading }: UpcomingDeadlinesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-[var(--accent-primary)]" />
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-secondary)]">
            timeline
          </p>
          <h3 className="panel-heading text-base">Upcoming Deadlines</h3>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        <p className="py-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          no upcoming deadlines in the next 7 days
        </p>
      ) : (
        <div className="space-y-2">
          {deadlines.map((item) => {
            const pStyle = priorityColors[item.priority];
            return (
              <div
                key={item.task_id}
                className="surface-subtle flex items-center gap-3 p-3 transition-colors hover:border-[var(--glass-border-hot)]"
              >
                <span className={cn('w-2 h-2 rounded-full', pStyle.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-[var(--text-primary)]">{item.task_title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {item.project_name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                  <Calendar size={12} />
                  {formatDate(item.deadline)}
                </div>
                <ArrowRight size={14} className="text-[var(--text-muted)]" />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
