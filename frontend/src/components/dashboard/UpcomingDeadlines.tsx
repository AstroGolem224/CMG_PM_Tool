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
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-primary-400" />
        <h3 className="text-sm font-semibold text-white">Upcoming Deadlines</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : deadlines.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No upcoming deadlines in the next 7 days.
        </p>
      ) : (
        <div className="space-y-2">
          {deadlines.map((item) => {
            const pStyle = priorityColors[item.priority];
            return (
              <div
                key={item.task_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <span className={cn('w-2 h-2 rounded-full', pStyle.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{item.task_title}</p>
                  <p className="text-xs text-gray-500">{item.project_name}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                  <Calendar size={12} />
                  {formatDate(item.deadline)}
                </div>
                <ArrowRight size={14} className="text-gray-600" />
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
