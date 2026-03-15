/** Dashboard page content with stats, deadlines, and activity feed */
import { useEffect, useState } from 'react';
import StatsCards from './StatsCards';
import UpcomingDeadlines from './UpcomingDeadlines';
import RecentActivity from './RecentActivity';
import { dashboardApi } from '@/api/dashboard';
import type { DashboardStats, DeadlineItem, ActivityItem } from '@/types';

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [statsData, deadlinesData, activityData] = await Promise.allSettled([
          dashboardApi.getStats(),
          dashboardApi.getDeadlines(),
          dashboardApi.getActivity(),
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (deadlinesData.status === 'fulfilled') setDeadlines(deadlinesData.value);
        if (activityData.status === 'fulfilled') setActivities(activityData.value);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines deadlines={deadlines} loading={loading} />
        <RecentActivity activities={activities} loading={loading} />
      </div>
    </div>
  );
}
