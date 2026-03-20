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
  likes: number;
  dislikes: number;
  difficulty: number;
  total_attempts: number;
  solved_count: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pages: number;
}
