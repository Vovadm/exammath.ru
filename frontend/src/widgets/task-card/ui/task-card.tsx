'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/features/auth/model/auth-context';
import { AnswerChecker } from '@/features/task-check/ui/answer-checker';
import { SolutionEditor } from '@/features/task-solution/ui/solution-editor';
import { StudentSolutionsList } from '@/features/student-solutions/ui/student-solutions-list';
import { useSolutionEditor } from '@/features/task-solution/model/use-solution-editor';

import { solutionApi } from '@/entities/solution/api/solution-api';
import type { Task } from '@/entities/task/model/types';
import { TYPE_NAMES, PART2_TYPES } from '@/shared/config/task-types';
import { formatMath } from '@/lib/math-format';

interface TaskCardProps {
  task: Task;
  index: number;
}

export function TaskCard({ task, index }: TaskCardProps) {
  const { user } = useAuth();
  const [showSolution, setShowSolution] = useState(false);
  const [initialAnswer, setInitialAnswer] = useState('');

  const editor = useSolutionEditor();

  const isPart2 = PART2_TYPES.has(task.task_type);
  const showAnswerField = !isPart2 || !!task.answer;
  const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'teacher';
  const typeName = TYPE_NAMES[task.task_type] ?? '???';

  useEffect(() => {
    if (!user) return;
    solutionApi
      .getMy(task.id)
      .then((solutions) => {
        editor.loadFromSolution(solutions);
        if (solutions[0]?.answer) setInitialAnswer(solutions[0].answer);
      })
      .catch(() => {});
  }, [user, task.id]);

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between py-3 px-5">
        <span className="font-bold text-indigo-600">Задание #{index}</span>
        <div className="flex gap-2 items-center">
          <Badge variant={isPart2 ? 'secondary' : 'default'}>
            №{task.task_type} {typeName}
          </Badge>
          {task.images?.length > 0 && <Badge variant="outline">📷</Badge>}
          {task.tables?.length > 0 && <Badge variant="outline">📊</Badge>}
          <Link
            href={`/tasks/${task.id}`}
            className="text-xs text-gray-400 font-mono hover:underline hover:text-indigo-600 transition-colors"
          >
            {task.fipi_id}
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div
          className="text-sm leading-8 text-gray-800"
          dangerouslySetInnerHTML={{ __html: formatMath(task.text) }}
        />

        {task.tables?.map((t, i) => (
          <div
            key={i}
            className="my-4 overflow-x-auto"
            dangerouslySetInnerHTML={{
              __html: t
                .replace('<table>', '<table class="w-full border-collapse text-sm">')
                .replace(
                  /<td/g,
                  '<td class="border border-gray-300 px-3 py-2 text-center"',
                )
                .replace(
                  /<th/g,
                  '<th class="border border-gray-300 px-3 py-2 text-center bg-indigo-50 font-semibold text-indigo-900"',
                ),
            }}
          />
        ))}

        {task.images?.map((url, i) => (
          <div key={i} className="mt-4 relative w-full h-96">
            <Image
              src={url}
              alt="Задание"
              fill
              className="rounded-lg border object-contain"
            />
          </div>
        ))}

        {showSolution && (
          <SolutionEditor
            taskId={task.id}
            answer={initialAnswer}
            onClose={() => setShowSolution(false)}
            solutionText={editor.solutionText}
            setSolutionText={editor.setSolutionText}
            solutionFiles={editor.solutionFiles}
            uploading={editor.uploading}
            fileInputRef={editor.fileInputRef}
            save={editor.save}
            handleFileChange={editor.handleFileChange}
            triggerUpload={editor.triggerUpload}
          />
        )}

        {isTeacherOrAdmin && <StudentSolutionsList taskId={task.id} />}
      </CardContent>

      <CardFooter className="border-t px-5 py-3 flex justify-between items-center flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSolution(!showSolution)}
        >
          📝 Решение
        </Button>

        {showAnswerField && (
          <AnswerChecker taskId={task.id} initialAnswer={initialAnswer} />
        )}
      </CardFooter>
    </Card>
  );
}
