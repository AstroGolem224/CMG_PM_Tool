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
  fetchColumns: (projectId: string) => Promise<void>;
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
    const project = await projectsApi.create(data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  updateProject: async (id, data) => {
    const updated = await projectsApi.update(id, data);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
      currentProject: state.currentProject?.id === id ? updated : state.currentProject,
    }));
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    }));
  },

  archiveProject: async (id) => {
    const updated = await projectsApi.archive(id);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updated : p)),
    }));
  },

  fetchColumns: async (projectId) => {
    try {
      const columns = await projectsApi.getColumns(projectId);
      set({ columns });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  setCurrentProject: (project) => set({ currentProject: project }),
}));
