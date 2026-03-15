import http from '@/shared/api/http';

export interface AdminStats {
  total_tasks: number;
  total_users: number;
  tasks_by_type: Record<string, number>;
}

export const adminApi = {
  getStats: () => http.get<AdminStats>('/admin/stats').then((r) => r.data),
};
