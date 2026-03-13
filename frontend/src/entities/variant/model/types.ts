import type { Task } from '@/entities/task/model/types';
import type { SolutionFile, SolutionContent } from '@/entities/solution/model/types';

export interface Variant {
  id: number;
  title: string;
  description?: string;
  created_by: number;
  class_id?: number | null;
  is_public: boolean;
  created_at: string;
  tasks: Task[];
}

export interface VariantStudentSolution {
  task_id: number;
  task_type: number;
  answer?: string;
  is_correct?: boolean;
  content: SolutionContent[];
  files: SolutionFile[];
}
