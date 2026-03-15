import http from '@/shared/api/http';
import type { SchoolClass, ClassMember } from '@/entities/user/model/types';

export interface ClassCreate {
  name: string;
  description?: string | null;
}

export interface ClassAddMember {
  user_id: number;
  role: string;
}

export const classApi = {
  getList: () => http.get<SchoolClass[]>('/classes').then((r) => r.data),

  create: (data: ClassCreate) =>
    http.post<SchoolClass>('/classes', data).then((r) => r.data),

  delete: (classId: number) => http.delete(`/classes/${classId}`).then((r) => r.data),

  addMember: (classId: number, data: ClassAddMember) =>
    http.post<ClassMember>(`/classes/${classId}/members`, data).then((r) => r.data),

  removeMember: (classId: number, userId: number) =>
    http.delete(`/classes/${classId}/members/${userId}`).then((r) => r.data),
};
