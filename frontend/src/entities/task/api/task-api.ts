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
};
