export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  created_at: string;
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

export interface TypeStatItem {
  task_type: number;
  attempts: number;
  correct: number;
  success_rate: number;
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
