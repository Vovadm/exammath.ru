export interface SolutionFile {
  id: number;
  filename: string;
  filepath: string;
  file_type?: string;
}

export interface SolutionContent {
  type: string;
  value: string;
}

export interface Solution {
  id: number;
  user_id: number;
  task_id: number;
  answer?: string;
  is_correct?: boolean;
  content: SolutionContent[];
  files: SolutionFile[];
  created_at: string;
  updated_at: string;
  username?: string;
}
