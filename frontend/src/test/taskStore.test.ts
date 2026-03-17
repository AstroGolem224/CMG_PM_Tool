import { act } from '@testing-library/react';
import { tasksApi } from '@/api/tasks';
import { useTaskStore } from '@/stores/taskStore';

vi.mock('@/api/tasks', () => ({
  tasksApi: {
    listByProject: vi.fn(),
    create: vi.fn(),
    get: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    move: vi.fn(),
    reorder: vi.fn(),
    bulk: vi.fn(),
  },
}));

const baseTask = {
  id: 'task-1',
  project_id: 'project-1',
  column_id: 'column-backlog',
  title: 'Weekly Standup',
  description: 'task description',
  priority: 'medium' as const,
  position: 0,
  deadline: null,
  recurrence_type: 'weekly' as const,
  recurrence_interval: 1,
  recurrence_days: '2,4',
  next_due_date: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  labels: [],
  comments: [],
};

describe('taskStore moveTask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTaskStore.setState({
      tasks: [baseTask],
      selectedTask: baseTask,
      loading: false,
      error: null,
    });
  });

  it('refetches tasks after a successful move so recurring clones appear', async () => {
    vi.mocked(tasksApi.move).mockResolvedValue({
      ...baseTask,
      column_id: 'column-done',
      title: '✅ Weekly Standup',
    });
    vi.mocked(tasksApi.listByProject).mockResolvedValue([
      {
        ...baseTask,
        column_id: 'column-done',
        title: '✅ Weekly Standup',
      },
      {
        ...baseTask,
        id: 'task-2',
        column_id: 'column-backlog',
        title: 'Weekly Standup',
      },
    ]);

    await act(async () => {
      await useTaskStore.getState().moveTask('task-1', { column_id: 'column-done', position: 0 });
    });

    expect(tasksApi.move).toHaveBeenCalledWith('task-1', { column_id: 'column-done', position: 0 });
    expect(tasksApi.listByProject).toHaveBeenCalledWith('project-1');
    expect(useTaskStore.getState().tasks).toHaveLength(2);
    expect(useTaskStore.getState().tasks.some((task) => task.id === 'task-2')).toBe(true);
  });
});
