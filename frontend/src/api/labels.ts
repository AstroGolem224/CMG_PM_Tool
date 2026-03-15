/** API calls for label management */
import client from './client';
import type { Label, CreateLabelPayload } from '@/types';

export const labelsApi = {
  listByProject: (projectId: string) =>
    client.get<Label[]>(`/projects/${projectId}/labels`).then((r) => r.data),

  create: (data: CreateLabelPayload) =>
    client.post<Label>('/labels', data).then((r) => r.data),

  update: (id: string, data: { name?: string; color?: string }) =>
    client.put<Label>(`/labels/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/labels/${id}`).then((r) => r.data),

  assignToTask: (taskId: string, labelId: string) =>
    client.post(`/tasks/${taskId}/labels/${labelId}`).then((r) => r.data),

  removeFromTask: (taskId: string, labelId: string) =>
    client.delete(`/tasks/${taskId}/labels/${labelId}`).then((r) => r.data),
};
