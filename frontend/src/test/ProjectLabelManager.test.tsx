import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectLabelManager from '@/components/projects/ProjectLabelManager';

const listByProject = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();

vi.mock('@/api/labels', () => ({
  labelsApi: {
    listByProject: (...args: unknown[]) => listByProject(...args),
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
    delete: (...args: unknown[]) => remove(...args),
  },
}));

describe('ProjectLabelManager', () => {
  beforeEach(() => {
    listByProject.mockResolvedValue([
      {
        id: 'label-1',
        project_id: 'project-1',
        name: 'backend',
        color: '#3b82f6',
      },
    ]);
    create.mockResolvedValue({
      id: 'label-2',
      project_id: 'project-1',
      name: 'ops',
      color: '#06b6d4',
    });
    update.mockResolvedValue({
      id: 'label-1',
      project_id: 'project-1',
      name: 'platform',
      color: '#14b8a6',
    });
    remove.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates, edits and deletes labels through the manager', async () => {
    render(<ProjectLabelManager projectId="project-1" />);

    await expect(screen.findByText('backend')).resolves.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit backend' }));
    fireEvent.change(screen.getByPlaceholderText('rename label'), {
      target: { value: 'platform' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('label-1', {
        name: 'platform',
        color: '#3b82f6',
      })
    );
    expect(await screen.findByText('platform')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete platform' }));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('label-1'));
    await waitFor(() => expect(screen.queryByText('platform')).not.toBeInTheDocument());

    fireEvent.change(screen.getByTestId('project-label-create-name'), {
      target: { value: 'ops' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Label' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        project_id: 'project-1',
        name: 'ops',
        color: '#06b6d4',
      })
    );
    expect(await screen.findByText('ops')).toBeInTheDocument();
  });
});
