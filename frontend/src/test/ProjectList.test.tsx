import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectList from '@/components/projects/ProjectList';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

describe('ProjectList', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [],
      currentProject: null,
      columns: [],
      loading: false,
      error: 'Backend unavailable',
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    });
    useUIStore.setState({ sidebarOpen: true, activeView: 'dashboard', modalType: null, modalData: {}, taskDetailOpen: false });
  });

  it('shows an error banner when project loading fails', () => {
    render(
      <MemoryRouter>
        <ProjectList />
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Backend unavailable');
  });
});
