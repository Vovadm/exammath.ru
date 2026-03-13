import http from '@/shared/api/http';
import type { UserStats, TypeStatItem } from '../model/types';

export interface HistoryItem {
  id: number;
  task_id: number;
  answer: string;
  is_correct: boolean;
  created_at: string;
}

export const profileApi = {
  getMyStats: () => http.get<UserStats>('/profile/stats').then((r) => r.data),

  getMyTypeStats: () =>
    http.get<TypeStatItem[]>('/profile/type-stats').then((r) => r.data),

  getMyHistory: () => http.get<HistoryItem[]>('/profile/history').then((r) => r.data),

  getUserStats: (userId: number) =>
    http.get<UserStats>(`/profile/user/${userId}/stats`).then((r) => r.data),

  getUserTypeStats: (userId: number) =>
    http.get<TypeStatItem[]>(`/profile/user/${userId}/type-stats`).then((r) => r.data),

  getUserHistory: (userId: number) =>
    http.get<HistoryItem[]>(`/profile/user/${userId}/history`).then((r) => r.data),

  changePassword: (oldPassword: string, newPassword: string) =>
    http.post('/profile/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  deleteAccount: () => http.delete('/profile/me'),
};
