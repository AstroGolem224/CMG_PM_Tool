/** Dashboard page content with stats, deadlines, and activity feed */
import { useEffect, useState } from 'react';
import StatsCards from './StatsCards';
import UpcomingDeadlines from './UpcomingDeadlines';
import RecentActivity from './RecentActivity';
import { dashboardApi } from '@/api/dashboard';
import LabelFilterBar from '@/components/common/LabelFilterBar';
import ErrorBanner from '@/components/common/ErrorBanner';
import type {
  ActivityItem,
  DashboardLabelItem,
  DashboardStats,
  DeadlineItem,
  TaskFilterState,
} from '@/types';

const defaultFilters: TaskFilterState = {
  labelIds: [],
  priorities: [],
  completion: 'all',
};

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [labels, setLabels] = useState<DashboardLabelItem[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsData, deadlinesData, activityData, labelsData] = await Promise.allSettled([
          dashboardApi.getStats(filters),
          dashboardApi.getDeadlines(filters),
          dashboardApi.getActivity(filters),
          dashboardApi.getLabels(),
        ]);

        if (statsData.status === 'fulfilled') setStats(statsData.value);
        if (deadlinesData.status === 'fulfilled') setDeadlines(deadlinesData.value);
        if (activityData.status === 'fulfilled') setActivities(activityData.value);
        if (labelsData.status === 'fulfilled') setLabels(labelsData.value);
        if (
          statsData.status === 'rejected' &&
          deadlinesData.status === 'rejected' &&
          activityData.status === 'rejected' &&
          labelsData.status === 'rejected'
        ) {
          setError('Dashboard data could not be loaded from the API.');
        }
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [filters]);

  return (
    <div className="space-y-6 max-w-7xl">
      {error && <ErrorBanner message={error} />}
      <LabelFilterBar
        testId="dashboard-label-filter"
        labels={labels}
        filters={filters}
        title="Dashboard Slice"
        hint="slice telemetry, deadlines and activity by labels, priority and completion."
        emptyText="no dashboard labels available"
        onChange={setFilters}
      />
      <StatsCards stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines deadlines={deadlines} loading={loading} />
        <RecentActivity activities={activities} loading={loading} />
      </div>
    </div>
  );
}
