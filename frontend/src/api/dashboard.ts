/** API calls for the dashboard view */
import client from './client';
import type {
  ActivityItem,
  DashboardLabelItem,
  DashboardStats,
  DeadlineItem,
  TaskFilterState,
} from '@/types';

function withTaskFilters(filters: TaskFilterState) {
  const params: Record<string, string> = {};
  if (filters.labelIds.length > 0) params.label_ids = filters.labelIds.join(',');
  if (filters.priorities.length > 0) params.priorities = filters.priorities.join(',');
  if (filters.completion !== 'all') params.completion = filters.completion;
  return Object.keys(params).length > 0 ? { params } : undefined;
}

export const dashboardApi = {
  getStats: (filters: TaskFilterState) =>
    client.get<DashboardStats>('/dashboard', withTaskFilters(filters)).then((r) => r.data),

  getDeadlines: (filters: TaskFilterState) =>
    client.get<DeadlineItem[]>('/dashboard/deadlines', withTaskFilters(filters)).then((r) => r.data),

  getActivity: (filters: TaskFilterState) =>
    client.get<ActivityItem[]>('/dashboard/activity', withTaskFilters(filters)).then((r) => r.data),

  getLabels: () =>
    client.get<DashboardLabelItem[]>('/dashboard/labels').then((r) => r.data),
};
