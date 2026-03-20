import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { AnswerChecker } from '@/features/task-check/ui/answer-checker';
import type { Task } from '@/entities/task/model/types';
import { PART2_TYPES } from '@/shared/config/task-types';

interface TaskCardFooterProps {
  task: Task;
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
  isLoading: boolean;
  handleLike: () => void;
  handleDislike: () => void;
  showSolution: boolean;
  setShowSolution: (v: boolean) => void;
  initialAnswer: string;
  initialCorrect: boolean | null;
}

export function TaskCardFooter({
  task,
  likes,
  dislikes,
  userVote,
  isLoading,
  handleLike,
  handleDislike,
  showSolution,
  setShowSolution,
  initialAnswer,
  initialCorrect,
}: TaskCardFooterProps) {
  const isPart2 = PART2_TYPES.has(task.task_type);
  const showAnswerField = !isPart2 || !!task.answer;

  return (
    <CardFooter className="border-t px-5 py-3 flex justify-between items-center flex-wrap gap-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 bg-gray-50 rounded-md p-1 border">
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className={`h-8 px-2 transition-colors ${userVote === 'like' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-200'}`}
            onClick={handleLike}
          >
            <ThumbsUp
              className={`w-4 h-4 mr-1.5 ${userVote === 'like' ? 'fill-current text-green-600' : 'text-green-600'}`}
            />
            <span className="text-xs font-semibold">{likes}</span>
          </Button>
          <div className="w-px h-4 bg-gray-300" />
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className={`h-8 px-2 transition-colors ${userVote === 'dislike' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'hover:bg-gray-200'}`}
            onClick={handleDislike}
          >
            <ThumbsDown
              className={`w-4 h-4 mr-1.5 ${userVote === 'dislike' ? 'fill-current text-red-600' : 'text-red-600'}`}
            />
            <span className="text-xs font-semibold">{dislikes}</span>
          </Button>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Сложность:{' '}
          <span className="text-gray-900 font-bold ml-1">{task.difficulty || 0}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSolution(!showSolution)}
        >
          📝 Решение
        </Button>

        {showAnswerField && (
          <AnswerChecker
            taskId={task.id}
            initialAnswer={initialAnswer}
            initialCorrect={initialCorrect}
          />
        )}
      </div>
    </CardFooter>
  );
}
