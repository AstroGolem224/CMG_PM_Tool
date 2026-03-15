/** API calls for task comments */
import client from './client';
import type { Comment, CreateCommentPayload } from '@/types';

export const commentsApi = {
  listByTask: (taskId: string) =>
    client.get<Comment[]>(`/tasks/${taskId}/comments`).then((r) => r.data),

  create: (data: CreateCommentPayload) =>
    client.post<Comment>('/comments', data).then((r) => r.data),

  update: (id: string, data: { content: string }) =>
    client.put<Comment>(`/comments/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/comments/${id}`).then((r) => r.data),
};
