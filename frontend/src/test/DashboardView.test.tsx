import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DashboardView from '@/components/dashboard/DashboardView';

const getStats = vi.fn();
const getDeadlines = vi.fn();
const getActivity = vi.fn();
const getLabels = vi.fn();

vi.mock('@/api/dashboard', () => ({
  dashboardApi: {
    getStats: (...args: unknown[]) => getStats(...args),
    getDeadlines: (...args: unknown[]) => getDeadlines(...args),
    getActivity: (...args: unknown[]) => getActivity(...args),
    getLabels: (...args: unknown[]) => getLabels(...args),
  },
}));

describe('DashboardView', () => {
  beforeEach(() => {
    getStats.mockResolvedValue({
      total_tasks: 5,
      in_progress: 3,
      completed: 2,
      overdue: 1,
    });
    getDeadlines.mockResolvedValue([]);
    getActivity.mockResolvedValue([]);
    getLabels.mockResolvedValue([
      {
        id: 'label-1',
        project_id: 'project-1',
        project_name: 'ops',
        name: 'focus',
        color: '#22c55e',
      },
    ]);
  });

  it('refetches dashboard data when label, priority and completion filters change', async () => {
    render(<DashboardView />);

    await screen.findByRole('button', { name: /focus/i });
    await waitFor(() =>
      expect(getStats).toHaveBeenCalledWith({ labelIds: [], priorities: [], completion: 'all' })
    );

    fireEvent.click(screen.getByRole('button', { name: /focus/i }));
    fireEvent.click(screen.getByRole('button', { name: /priority high/i }));
    fireEvent.click(screen.getByRole('button', { name: /status done/i }));

    const expectedFilters = { labelIds: ['label-1'], priorities: ['high'], completion: 'done' };
    await waitFor(() => expect(getStats).toHaveBeenLastCalledWith(expectedFilters));
    await waitFor(() => expect(getDeadlines).toHaveBeenLastCalledWith(expectedFilters));
    await waitFor(() => expect(getActivity).toHaveBeenLastCalledWith(expectedFilters));
  });
});
