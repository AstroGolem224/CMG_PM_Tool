/** API calls for task management */
import client from './client';
import type { Task, CreateTaskPayload, UpdateTaskPayload, MoveTaskPayload } from '@/types';

export const tasksApi = {
  listByProject: (projectId: string) =>
    client.get<Task[]>(`/projects/${projectId}/tasks`).then((r) => r.data),

  create: (data: CreateTaskPayload) =>
    client.post<Task>('/tasks', data).then((r) => r.data),

  get: (id: string) =>
    client.get<Task>(`/tasks/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateTaskPayload) =>
    client.put<Task>(`/tasks/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/tasks/${id}`).then((r) => r.data),

  move: (id: string, data: MoveTaskPayload) =>
    client.patch<Task>(`/tasks/${id}/move`, data).then((r) => r.data),

  reorder: (data: { column_id: string; task_ids: string[] }) =>
    client.patch('/tasks/reorder', data).then((r) => r.data),
};
