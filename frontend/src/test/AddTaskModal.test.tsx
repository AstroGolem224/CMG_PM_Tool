import { fireEvent, render, screen } from '@testing-library/react';
import AddTaskModal from '@/components/kanban/AddTaskModal';
import { useProjectStore } from '@/stores/projectStore';
import { useTaskStore } from '@/stores/taskStore';

describe('AddTaskModal', () => {
  beforeEach(() => {
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

    useTaskStore.setState({
      tasks: [],
      selectedTask: null,
      loading: false,
      error: null,
    });
  });

  it('exposes pressed state for priority and weekly recurrence toggles', () => {
    render(<AddTaskModal columnId="column-1" onClose={vi.fn()} />);

    const urgentButton = screen.getByRole('button', { name: 'urgent' });
    expect(urgentButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(urgentButton);
    expect(urgentButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByLabelText(/recurrence/i), { target: { value: 'weekly' } });

    const mondayButton = screen.getByRole('button', { name: 'Mon' });
    expect(mondayButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(mondayButton);
    expect(mondayButton).toHaveAttribute('aria-pressed', 'true');
  });
});
