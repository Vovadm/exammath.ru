import http from '@/shared/api/http';
import type { Solution } from '../model/types';

export interface CheckAnswerResponse {
  correct: boolean;
  correct_answer?: string;
}

export const solutionApi = {
  check: (task_id: number, answer: string) =>
    http
      .post<CheckAnswerResponse>('/solutions/check', { task_id, answer })
      .then((r) => r.data),

  save: (task_id: number, answer: string | null, content: Solution['content']) =>
    http.post<Solution>('/solutions', { task_id, answer, content }).then((r) => r.data),

  getMy: (task_id: number) =>
    http.get<Solution[]>(`/solutions/task/${task_id}`).then((r) => r.data),

  getAll: (task_id: number) =>
    http.get<Solution[]>(`/solutions/task/${task_id}/all`).then((r) => r.data),

  uploadFile: (solution_id: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return http
      .post<{
        id: number;
        filename: string;
        original: string;
      }>(`/solutions/upload/${solution_id}`, form)
      .then((r) => r.data);
  },
};
