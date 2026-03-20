import http from '@/shared/api/http';
import type { Task, TaskListResponse } from '../model/types';

interface GetTasksParams {
  page?: number;
  per_page?: number;
  task_type?: number;
  search?: string;
  filter?: string;
}

export const taskApi = {
  getList: (params: GetTasksParams) =>
    http.get<TaskListResponse>('/tasks', { params }).then((r) => r.data),

  getById: (id: number) => http.get<Task>(`/tasks/${id}`).then((r) => r.data),

  getVote: (id: number) =>
    http
      .get<{ vote: 'like' | 'dislike' | null }>(`/tasks/${id}/vote`)
      .then((r) => r.data),

  vote: (id: number, vote: 'like' | 'dislike' | null) =>
    http
      .post<{
        likes: number;
        dislikes: number;
        user_vote: string | null;
      }>(`/tasks/${id}/vote`, { vote })
      .then((r) => r.data),
};
