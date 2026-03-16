import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskDetailPanel from '@/components/tasks/TaskDetailPanel';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';
import { useUIStore } from '@/stores/uiStore';

vi.mock('@/api/tasks', () => ({
  tasksApi: {
    get: vi.fn(async (id: string) => ({
      id,
      project_id: 'project-1',
      column_id: 'column-1',
      title: 'Build API',
      description: 'desc',
      priority: 'medium',
      position: 0,
      deadline: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      labels: [],
      comments: [],
    })),
  },
}));

vi.mock('@/components/tasks/TaskLabels', () => ({
  default: () => <div>Task labels</div>,
}));

vi.mock('@/components/tasks/TaskComments', () => ({
  default: () => <div>Task comments</div>,
}));

describe('TaskDetailPanel', () => {
  beforeEach(() => {
    useTaskStore.setState({
      tasks: [],
      selectedTask: {
        id: 'task-1',
        project_id: 'project-1',
        column_id: 'column-1',
        title: 'Build API',
        description: 'desc',
        priority: 'medium',
        position: 0,
        deadline: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        labels: [],
        comments: [],
      },
      loading: false,
      error: null,
    });
    useProjectStore.setState({
      projects: [],
      currentProject: {
        id: 'project-1',
        name: 'ops',
        description: '',
        color: '#fff',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        columns: [],
      },
      columns: [],
      loading: false,
      error: null,
    });
    useUIStore.setState({ taskDetailOpen: true, sidebarOpen: true, activeView: 'dashboard', modalType: null, modalData: {} });
  });

  it('saves changed title through the store action', async () => {
    const updateTask = vi.spyOn(useTaskStore.getState(), 'updateTask').mockResolvedValue();

    render(<TaskDetailPanel />);

    const titleInput = screen.getByLabelText('Title');
    fireEvent.change(titleInput, { target: { value: 'Build backend API' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith(
        'task-1',
        expect.objectContaining({ title: 'Build backend API' })
      )
    );
  });

  it('locks editing when the project is archived', async () => {
    const updateTask = vi.spyOn(useTaskStore.getState(), 'updateTask').mockResolvedValue();
    useProjectStore.setState((state) => ({
      ...state,
      currentProject: state.currentProject ? { ...state.currentProject, status: 'archived' } : null,
    }));

    render(<TaskDetailPanel />);

    expect(screen.getByText(/archived project: task details are read-only/i)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(updateTask).not.toHaveBeenCalled());
  });
});
