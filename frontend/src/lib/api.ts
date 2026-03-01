import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !['/login', '/register', '/tasks', '/'].includes(window.location.pathname)
    ) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
}

export interface Task {
  id: number;
  fipi_id: string;
  guid?: string;
  task_type: number;
  text: string;
  hint?: string;
  answer?: string;
  images: string[];
  inline_images: string[];
  tables: string[];
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
}

export interface SolutionFile {
  id: number;
  filename: string;
  filepath: string;
  file_type?: string;
}

export interface Solution {
  id: number;
  user_id: number;
  task_id: number;
  answer?: string;
  is_correct?: boolean;
  content: { type: string; value: string }[];
  files: SolutionFile[];
  created_at: string;
  updated_at: string;
  username?: string;
}

export interface UserStats {
  total_attempts: number;
  correct_attempts: number;
  tasks_solved: number;
  accuracy: number;
  streak_current: number;
  streak_max: number;
  last_activity?: string;
  stats_by_type: Record<string, { attempts: number; correct: number }>;
}

export interface Variant {
  id: number;
  title: string;
  description?: string;
  created_by: number;
  created_at: string;
  tasks: Task[];
}

export interface SchoolClass {
  id: number;
  name: string;
  description?: string;
  created_by: number;
  created_at: string;
  members: ClassMember[];
}

export interface ClassMember {
  id: number;
  user_id: number;
  username: string;
  email: string;
  role: string;
}

export const TYPE_NAMES: Record<number, string> = {
  0: 'Не определён',
  1: 'Планиметрия',
  2: 'Векторы',
  3: 'Стереометрия',
  4: 'Вероятность (простая)',
  5: 'Вероятность (сложная)',
  6: 'Уравнения',
  7: 'Выражения',
  8: 'Производная (график)',
  9: 'Физика/Формулы',
  10: 'Текстовые задачи',
  11: 'Графики',
  12: 'Производная (экстремум)',
  13: 'Уравнения (ч.2)',
  14: 'Стереометрия (ч.2)',
  15: 'Неравенства',
  16: 'Экономика',
  17: 'Планиметрия (ч.2)',
  18: 'Параметры',
  19: 'Числа',
};

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
