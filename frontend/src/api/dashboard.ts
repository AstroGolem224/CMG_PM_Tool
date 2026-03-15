/** API calls for the dashboard view */
import client from './client';
import type { DashboardStats, DeadlineItem, ActivityItem } from '@/types';

export const dashboardApi = {
  getStats: () =>
    client.get<DashboardStats>('/dashboard').then((r) => r.data),

  getDeadlines: () =>
    client.get<DeadlineItem[]>('/dashboard/deadlines').then((r) => r.data),

  getActivity: () =>
    client.get<ActivityItem[]>('/dashboard/activity').then((r) => r.data),
};
