import http from '@/shared/api/http';
import type { TaskListResponse } from '@/entities/task/model/types';

export interface AdminStats {
  total_tasks: number;
  total_users: number;
  tasks_by_type: Record<string, number>;
}

export const adminApi = {
  getStats: () => http.get<AdminStats>('/admin/stats').then((r) => r.data),

  getTasks: (params: {
    page?: number;
    per_page?: number;
    task_type?: number;
    search?: string;
    filter?: string;
  }) => http.get<TaskListResponse>('/admin/tasks', { params }).then((r) => r.data),
};
