/** Zustand store for project state management */
import { create } from 'zustand';
import type { Project, Column, CreateProjectPayload, UpdateProjectPayload } from '@/types';
import { projectsApi } from '@/api/projects';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  columns: Column[];
  loading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: CreateProjectPayload) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectPayload) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  archiveProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  fetchColumns: (projectId: string) => Promise<void>;
  createColumn: (projectId: string, data: { name: string; color?: string }) => Promise<Column>;
  updateColumn: (
    projectId: string,
    columnId: string,
    data: { name?: string; color?: string; kind?: Column['kind'] }
  ) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  reorderColumns: (projectId: string, columnIds: string[]) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  columns: [],
  loading: false,
  error: null,

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectsApi.list();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await projectsApi.get(id);
      set({ currentProject: project, columns: project.columns ?? [], loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  createProject: async (data) => {
    set({ error: null });
    try {
      const project = await projectsApi.create(data);
      set((state) => ({ projects: [...state.projects, project], error: null }));
      return project;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  updateProject: async (id, data) => {
    set({ error: null });
    try {
      const updated = await projectsApi.update(id, data);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  deleteProject: async (id) => {
    set({ error: null });
    try {
      await projectsApi.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  archiveProject: async (id) => {
    set({ error: null });
    try {
      const updated = await projectsApi.archive(id);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        columns: state.currentProject?.id === id ? updated.columns ?? state.columns : state.columns,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  restoreProject: async (id) => {
    set({ error: null });
    try {
      const updated = await projectsApi.restore(id);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
        columns: state.currentProject?.id === id ? updated.columns ?? state.columns : state.columns,
        error: null,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  fetchColumns: async (projectId) => {
    try {
      const columns = await projectsApi.getColumns(projectId);
      set({ columns });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createColumn: async (projectId, data) => {
    set({ error: null });
    try {
      const column = await projectsApi.createColumn(projectId, data);
      set((state) => ({
        columns: [...state.columns, column].sort((a, b) => a.position - b.position),
        currentProject:
          state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                columns: [...(state.currentProject.columns ?? []), column].sort(
                  (a, b) => a.position - b.position
                ),
              }
            : state.currentProject,
      }));
      return column;
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  updateColumn: async (projectId, columnId, data) => {
    set({ error: null });
    try {
      const updated = await projectsApi.updateColumn(projectId, columnId, data);
      set((state) => ({
        columns: state.columns.map((column) => (column.id === columnId ? updated : column)),
        currentProject:
          state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                columns: (state.currentProject.columns ?? []).map((column) =>
                  column.id === columnId ? updated : column
                ),
              }
            : state.currentProject,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  deleteColumn: async (projectId, columnId) => {
    set({ error: null });
    try {
      await projectsApi.deleteColumn(projectId, columnId);
      set((state) => ({
        columns: state.columns
          .filter((column) => column.id !== columnId)
          .map((column, index) => ({ ...column, position: index })),
        currentProject:
          state.currentProject?.id === projectId
            ? {
                ...state.currentProject,
                columns: (state.currentProject.columns ?? [])
                  .filter((column) => column.id !== columnId)
                  .map((column, index) => ({ ...column, position: index })),
              }
            : state.currentProject,
      }));
    } catch (e) {
      set({ error: (e as Error).message });
      throw e;
    }
  },

  reorderColumns: async (projectId, columnIds) => {
    set((state) => {
      const columnMap = new Map(state.columns.map((column) => [column.id, column]));
      const reordered = columnIds
        .map((id, index) => {
          const column = columnMap.get(id);
          return column ? { ...column, position: index } : null;
        })
        .filter((column): column is Column => column !== null);

      return {
        columns: reordered,
        currentProject:
          state.currentProject?.id === projectId
            ? { ...state.currentProject, columns: reordered }
            : state.currentProject,
      };
    });

    try {
      await projectsApi.reorderColumns(projectId, columnIds);
    } catch (e) {
      set({ error: (e as Error).message });
      await useProjectStore.getState().fetchColumns(projectId);
      throw e;
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
