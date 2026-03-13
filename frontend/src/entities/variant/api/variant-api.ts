import http from '@/shared/api/http';
import type { Variant, VariantStudentSolution } from '../model/types';

export interface VariantCreate {
  title: string;
  description?: string;
  task_ids: number[];
  class_id?: number | null;
  is_public: boolean;
}

export const variantApi = {
  getList: () => http.get<Variant[]>('/variants').then((r) => r.data),

  getById: (id: number) => http.get<Variant>(`/variants/${id}`).then((r) => r.data),

  create: (data: VariantCreate) =>
    http.post<Variant>('/variants', data).then((r) => r.data),

  delete: (id: number) => http.delete(`/variants/${id}`).then((r) => r.data),

  getStudentSolutions: (variantId: number, studentId: number) =>
    http
      .get<
        VariantStudentSolution[]
      >(`/variants/${variantId}/student/${studentId}/solutions`)
      .then((r) => r.data),

  getTeacherVariants: () =>
    http.get<Variant[]>('/teacher/variants').then((r) => r.data),

  createTeacherVariant: (data: VariantCreate) =>
    http.post<Variant>('/teacher/variants', data).then((r) => r.data),
};
