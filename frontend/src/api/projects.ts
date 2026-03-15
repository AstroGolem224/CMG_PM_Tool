/** API calls for project management */
import client from './client';
import type { Project, Column, CreateProjectPayload, UpdateProjectPayload } from '@/types';

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

  getColumns: (projectId: string) =>
    client.get<Column[]>(`/projects/${projectId}/columns`).then((r) => r.data),

  createColumn: (projectId: string, data: { name: string; color?: string }) =>
    client.post<Column>(`/projects/${projectId}/columns`, data).then((r) => r.data),
};
