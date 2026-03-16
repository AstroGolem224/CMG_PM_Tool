import { fireEvent, render, screen } from '@testing-library/react';
import ProjectForm from '@/components/projects/ProjectForm';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

describe('ProjectForm', () => {
  beforeEach(() => {
    useProjectStore.setState({ error: null });
    useUIStore.setState({
      sidebarOpen: true,
      activeView: 'dashboard',
      modalType: 'createProject',
      modalData: {},
      taskDetailOpen: false,
    });
  });

  it('disables submit until the name is filled', () => {
    render(<ProjectForm />);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Project name...'), {
      target: { value: 'New project' },
    });
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });
});
