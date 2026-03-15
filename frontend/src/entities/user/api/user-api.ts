import http from '@/shared/api/http';
import type { User } from '../model/types';

export const userApi = {
  getAll: () => http.get<User[]>('/admin/users').then((r) => r.data),

  getById: (id: number) =>
    http
      .get<{ username: string; id: number }>(`/profile/user/${id}`)
      .then((r) => r.data),

  setRole: (userId: number, role: string) =>
    http.put(`/admin/users/${userId}/role?role=${role}`).then((r) => r.data),

  getTeacherClasses: () => http.get('/teacher/classes').then((r) => r.data),

  getTeacherStudents: () =>
    http
      .get<{ id: number; username: string; email: string }[]>('/teacher/students')
      .then((r) => r.data),
};
