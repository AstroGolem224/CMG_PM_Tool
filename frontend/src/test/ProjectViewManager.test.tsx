import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProjectViewManager from '@/components/projects/ProjectViewManager';
import type { ProjectView } from '@/types';

const listViews = vi.fn();
const createView = vi.fn();
const deleteView = vi.fn();
const updateView = vi.fn();
const reorderViews = vi.fn();

vi.mock('@/api/projects', () => ({
  projectsApi: {
    listViews: (...args: unknown[]) => listViews(...args),
    createView: (...args: unknown[]) => createView(...args),
    updateView: (...args: unknown[]) => updateView(...args),
    reorderViews: (...args: unknown[]) => reorderViews(...args),
    deleteView: (...args: unknown[]) => deleteView(...args),
  },
}));

describe('ProjectViewManager', () => {
  beforeEach(() => {
    listViews.mockResolvedValue([]);
    deleteView.mockResolvedValue(undefined);
    updateView.mockResolvedValue(undefined);
    reorderViews.mockResolvedValue(undefined);
  });

  it('applies the default project view on first load', async () => {
    const apply = vi.fn();
    listViews.mockResolvedValue([
      {
        id: 'view-default',
        project_id: 'project-1',
        name: 'launch focus',
        is_pinned: true,
        is_default: true,
        position: 0,
        label_ids: ['label-7'],
        priorities: ['urgent'],
        completion: 'done',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] satisfies ProjectView[]);

    render(
      <ProjectViewManager
        projectId="project-1"
        filters={{ labelIds: [], priorities: [], completion: 'all' }}
        onApply={apply}
      />
    );

    await waitFor(() =>
      expect(apply).toHaveBeenCalledWith({
        labelIds: ['label-7'],
        priorities: ['urgent'],
        completion: 'done',
      })
    );
  });

  it('saves, renames and applies a project view', async () => {
    const apply = vi.fn();
    const savedView: ProjectView = {
      id: 'view-1',
      project_id: 'project-1',
      name: 'focus',
      is_pinned: false,
      is_default: false,
      position: 0,
      label_ids: ['label-1'],
      priorities: ['high'],
      completion: 'done',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    createView.mockResolvedValue(savedView);
    updateView.mockResolvedValue({ ...savedView, name: 'focus-alt' });

    render(
      <ProjectViewManager
        projectId="project-1"
        filters={{ labelIds: ['label-1'], priorities: ['high'], completion: 'done' }}
        onApply={apply}
      />
    );

    await waitFor(() => expect(listViews).toHaveBeenCalledWith('project-1'));
    fireEvent.change(screen.getByPlaceholderText(/view name/i), { target: { value: 'focus' } });
    fireEvent.click(screen.getByRole('button', { name: /save current view/i }));

    await screen.findByRole('button', { name: 'focus' });
    fireEvent.click(screen.getByRole('button', { name: /rename view focus/i }));
    fireEvent.change(screen.getByDisplayValue('focus'), { target: { value: 'focus-alt' } });
    fireEvent.click(screen.getByRole('button', { name: /save focus/i }));
    await screen.findByRole('button', { name: 'focus-alt' });
    fireEvent.click(screen.getByRole('button', { name: 'focus-alt' }));

    expect(createView).toHaveBeenCalledWith('project-1', {
      name: 'focus',
      is_pinned: false,
      is_default: false,
      label_ids: ['label-1'],
      priorities: ['high'],
      completion: 'done',
    });
    expect(updateView).toHaveBeenCalledWith('project-1', 'view-1', { name: 'focus-alt' });
    expect(apply).toHaveBeenCalledWith({
      labelIds: ['label-1'],
      priorities: ['high'],
      completion: 'done',
    });
  });

  it('marks a view as default and pinned', async () => {
    const apply = vi.fn();
    const savedView: ProjectView = {
      id: 'view-1',
      project_id: 'project-1',
      name: 'focus',
      is_pinned: false,
      is_default: false,
      position: 0,
      label_ids: [],
      priorities: ['high'],
      completion: 'all',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    listViews.mockResolvedValue([savedView]);
    updateView.mockResolvedValue({ ...savedView, is_pinned: true, is_default: true });

    render(
      <ProjectViewManager
        projectId="project-1"
        filters={{ labelIds: [], priorities: [], completion: 'all' }}
        onApply={apply}
      />
    );

    await screen.findByRole('button', { name: 'focus' });
    fireEvent.click(screen.getByRole('button', { name: /set default focus/i }));

    await waitFor(() =>
      expect(updateView).toHaveBeenCalledWith('project-1', 'view-1', {
        is_default: true,
        is_pinned: true,
      })
    );
  });

  it('reorders pinned views', async () => {
    const apply = vi.fn();
    listViews.mockResolvedValue([
      {
        id: 'view-1',
        project_id: 'project-1',
        name: 'alpha',
        is_pinned: true,
        is_default: false,
        position: 0,
        label_ids: [],
        priorities: [],
        completion: 'all',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'view-2',
        project_id: 'project-1',
        name: 'beta',
        is_pinned: true,
        is_default: false,
        position: 1,
        label_ids: [],
        priorities: [],
        completion: 'all',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] satisfies ProjectView[]);

    render(
      <ProjectViewManager
        projectId="project-1"
        filters={{ labelIds: [], priorities: [], completion: 'all' }}
        onApply={apply}
      />
    );

    await screen.findByRole('button', { name: /open pinned view alpha/i });
    fireEvent.click(screen.getByRole('button', { name: /move down view alpha/i }));

    await waitFor(() =>
      expect(reorderViews).toHaveBeenCalledWith('project-1', true, ['view-2', 'view-1'])
    );
  });
});
