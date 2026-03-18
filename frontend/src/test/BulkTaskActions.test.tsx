import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BulkTaskActions from '@/components/kanban/BulkTaskActions';
import { useTaskStore } from '@/stores/taskStore';

describe('BulkTaskActions', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedTask: null,
      loading: false,
      error: null,
      bulkAction: vi.fn().mockResolvedValue(2),
    });
  });

  it('runs a priority bulk action for the filtered slice', async () => {
    const bulkAction = vi.spyOn(useTaskStore.getState(), 'bulkAction').mockResolvedValue(2);

    render(
      <BulkTaskActions
        projectId="project-1"
        tasks={[
          {
            id: 'task-1',
            project_id: 'project-1',
            column_id: 'col-1',
            title: 'A',
            description: '',
            priority: 'low',
            position: 0,
            deadline: null,
            recurrence_type: 'none',
            recurrence_interval: 1,
            recurrence_days: '',
            next_due_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            labels: [],
            comments: [],
          },
          {
            id: 'task-2',
            project_id: 'project-1',
            column_id: 'col-1',
            title: 'B',
            description: '',
            priority: 'low',
            position: 1,
            deadline: null,
            recurrence_type: 'none',
            recurrence_interval: 1,
            recurrence_days: '',
            next_due_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            labels: [],
            comments: [],
          },
        ]}
        columns={[
          {
            id: 'col-1',
            project_id: 'project-1',
            name: 'Backlog',
            kind: 'backlog',
            position: 0,
            color: '#fff',
            created_at: new Date().toISOString(),
          },
        ]}
      />
    );

    fireEvent.change(screen.getByDisplayValue('high'), { target: { value: 'urgent' } });
    fireEvent.click(screen.getByRole('button', { name: /update slice priority/i }));

    await waitFor(() =>
      expect(bulkAction).toHaveBeenCalledWith('project-1', {
        task_ids: ['task-1', 'task-2'],
        operation: 'priority',
        column_id: undefined,
        priority: 'urgent',
      })
    );
  });

  it('resyncs the target column when the active project changes', async () => {
    const bulkAction = vi.spyOn(useTaskStore.getState(), 'bulkAction').mockResolvedValue(1);
    const baseTask = {
      id: 'task-1',
      project_id: 'project-1',
      column_id: 'col-1',
      title: 'A',
      description: '',
      priority: 'low' as const,
      position: 0,
      deadline: null,
      recurrence_type: 'none' as const,
      recurrence_interval: 1,
      recurrence_days: '',
      next_due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
      comments: [],
    };

    const { rerender } = render(
      <BulkTaskActions
        projectId="project-1"
        tasks={[baseTask]}
        columns={[
          {
            id: 'col-1',
            project_id: 'project-1',
            name: 'Backlog',
            kind: 'backlog',
            position: 0,
            color: '#fff',
            created_at: new Date().toISOString(),
          },
          {
            id: 'col-2',
            project_id: 'project-1',
            name: 'Review',
            kind: 'review',
            position: 1,
            color: '#eee',
            created_at: new Date().toISOString(),
          },
        ]}
      />
    );

    fireEvent.change(screen.getByTestId('bulk-move-select'), { target: { value: 'col-2' } });

    rerender(
      <BulkTaskActions
        projectId="project-2"
        tasks={[{ ...baseTask, id: 'task-9', project_id: 'project-2', column_id: 'col-9' }]}
        columns={[
          {
            id: 'col-9',
            project_id: 'project-2',
            name: 'Inbox',
            kind: 'backlog',
            position: 0,
            color: '#ccc',
            created_at: new Date().toISOString(),
          },
        ]}
      />
    );

    expect(screen.getByTestId('bulk-move-select')).toHaveValue('col-9');

    fireEvent.click(screen.getByRole('button', { name: /move filtered tasks/i }));

    await waitFor(() =>
      expect(bulkAction).toHaveBeenCalledWith('project-2', {
        task_ids: ['task-9'],
        operation: 'move',
        column_id: 'col-9',
        priority: undefined,
      })
    );
  });
});
