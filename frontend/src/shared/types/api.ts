import { Task } from '@/entities/task/model/types';

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
}