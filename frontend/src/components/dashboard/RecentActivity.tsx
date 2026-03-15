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
      className="glass rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity size={18} className="text-primary-400" />
        <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No recent activity.
        </p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />

          <div className="space-y-3">
            {activities.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-start gap-3 relative"
              >
                <span className="w-[15px] h-[15px] rounded-full bg-gray-800 border-2 border-primary-500/50 shrink-0 mt-0.5 z-10" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-medium text-gray-200">{item.task_title}</span>
                    {' '}
                    <span className="text-gray-500">{item.action}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{item.project_name}</span>
                    <span className="text-xs text-gray-600">&middot;</span>
                    <span className="text-xs text-gray-600">{formatRelativeTime(item.timestamp)}</span>
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
