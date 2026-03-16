import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { useProjectStore } from '@/stores/projectStore';
import { useUIStore } from '@/stores/uiStore';

describe('Sidebar', () => {
  beforeEach(() => {
    useProjectStore.setState({
      projects: [
        {
          id: 'project-1',
          name: 'Ship Backend',
          description: 'Build the API slice',
          color: '#3b82f6',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      currentProject: null,
      columns: [],
      loading: false,
      error: null,
      fetchProjects: vi.fn().mockResolvedValue(undefined),
    });
    useUIStore.setState({ sidebarOpen: true, modalType: null, modalData: {}, taskDetailOpen: false });
  });

  it('renders fetched projects inside the sidebar', async () => {
    const fetchProjects = useProjectStore.getState().fetchProjects as ReturnType<typeof vi.fn>;

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    await waitFor(() => expect(fetchProjects).toHaveBeenCalled());
    expect(screen.getByText('Ship Backend')).toBeInTheDocument();
  });
});
