'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/features/auth/model/auth-context';
import { useSolutionEditor } from '@/features/task-solution/model/use-solution-editor';
import { solutionApi } from '@/entities/solution/api/solution-api';
import type { Task } from '@/entities/task/model/types';
import { TaskCardHeader } from './task-card-header';
import { TaskCardBody } from './task-card-body';
import { TaskCardFooter } from './task-card-footer';
import { useTaskRating } from '../model/use-task-rating';

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const { user } = useAuth();
  const [showSolution, setShowSolution] = useState(false);
  const [initialAnswer, setInitialAnswer] = useState('');
  const [initialCorrect, setInitialCorrect] = useState<boolean | null>(null);

  const editor = useSolutionEditor();
  const { likes, dislikes, userVote, handleLike, handleDislike } = useTaskRating(
    task.id,
    task.likes,
    task.dislikes,
  );

  const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    if (!user) return;
    solutionApi
      .getMy(task.id)
      .then((solutions) => {
        editor.loadFromSolution(solutions);
        if (solutions[0]) {
          if (solutions[0].answer) setInitialAnswer(solutions[0].answer);
          if (solutions[0].is_correct !== undefined)
            setInitialCorrect(solutions[0].is_correct);
        }
      })
      .catch(() => {});
  }, [user, task.id]);

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <TaskCardHeader task={task} index={index} />
      <TaskCardBody
        task={task}
        showSolution={showSolution}
        setShowSolution={setShowSolution}
        initialAnswer={initialAnswer}
        isTeacherOrAdmin={isTeacherOrAdmin}
        editor={editor}
      />
      <TaskCardFooter
        task={task}
        likes={likes}
        dislikes={dislikes}
        userVote={userVote}
        handleLike={handleLike}
        handleDislike={handleDislike}
        showSolution={showSolution}
        setShowSolution={setShowSolution}
        initialAnswer={initialAnswer}
        initialCorrect={initialCorrect}
      />
    </Card>
  );
}
