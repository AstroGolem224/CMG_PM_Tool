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
    icon: ListTodo,
    gradient: 'from-primary-500/20 to-primary-600/5',
    iconColor: 'text-primary-400',
  },
  {
    key: 'in_progress' as const,
    label: 'In Progress',
    icon: Clock,
    gradient: 'from-blue-500/20 to-blue-600/5',
    iconColor: 'text-blue-400',
  },
  {
    key: 'completed' as const,
    label: 'Completed',
    icon: CheckCircle2,
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    iconColor: 'text-emerald-400',
  },
  {
    key: 'overdue' as const,
    label: 'Overdue',
    icon: AlertTriangle,
    gradient: 'from-red-500/20 to-red-600/5',
    iconColor: 'text-red-400',
  },
];

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, gradient, iconColor }, index) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={`glass rounded-xl p-5 bg-gradient-to-br ${gradient}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {label}
            </span>
            <Icon size={20} className={iconColor} />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? (
              <span className="inline-block w-10 h-8 bg-white/10 rounded animate-pulse" />
            ) : (
              stats?.[key] ?? 0
            )}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
