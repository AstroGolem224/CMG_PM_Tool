/** API calls for project management */
import client from './client';
import type {
  Column,
  CreateProjectPayload,
  CreateProjectViewPayload,
  Project,
  ProjectView,
  UpdateProjectViewPayload,
  UpdateProjectPayload,
} from '@/types';

export const projectsApi = {
  list: () =>
    client.get<Project[]>('/projects').then((r) => r.data),

  create: (data: CreateProjectPayload) =>
    client.post<Project>('/projects', data).then((r) => r.data),

  get: (id: string) =>
    client.get<Project>(`/projects/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateProjectPayload) =>
    client.put<Project>(`/projects/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/projects/${id}`).then((r) => r.data),

  archive: (id: string) =>
    client.patch<Project>(`/projects/${id}/archive`).then((r) => r.data),

  restore: (id: string) =>
    client.patch<Project>(`/projects/${id}/restore`).then((r) => r.data),

  getColumns: (projectId: string) =>
    client.get<Column[]>(`/projects/${projectId}/columns`).then((r) => r.data),

  createColumn: (projectId: string, data: { name: string; color?: string }) =>
    client.post<Column>(`/projects/${projectId}/columns`, data).then((r) => r.data),

  updateColumn: (
    projectId: string,
    columnId: string,
    data: { name?: string; color?: string; kind?: 'backlog' | 'in_progress' | 'review' | 'done' | 'custom' }
  ) =>
    client.put<Column>(`/projects/${projectId}/columns/${columnId}`, data).then((r) => r.data),

  reorderColumns: (projectId: string, columnIds: string[]) =>
    client.patch(`/projects/${projectId}/columns/reorder`, { column_ids: columnIds }).then((r) => r.data),

  deleteColumn: (projectId: string, columnId: string) =>
    client.delete(`/projects/${projectId}/columns/${columnId}`).then((r) => r.data),

  listViews: (projectId: string) =>
    client.get<ProjectView[]>(`/projects/${projectId}/views`).then((r) => r.data),

  createView: (projectId: string, data: CreateProjectViewPayload) =>
    client.post<ProjectView>(`/projects/${projectId}/views`, data).then((r) => r.data),

  updateView: (projectId: string, viewId: string, data: UpdateProjectViewPayload) =>
    client.put<ProjectView>(`/projects/${projectId}/views/${viewId}`, data).then((r) => r.data),

  reorderViews: (projectId: string, isPinned: boolean, viewIds: string[]) =>
    client.patch(`/projects/${projectId}/views/reorder`, { is_pinned: isPinned, view_ids: viewIds }).then((r) => r.data),

  deleteView: (projectId: string, viewId: string) =>
    client.delete(`/projects/${projectId}/views/${viewId}`).then((r) => r.data),
};
