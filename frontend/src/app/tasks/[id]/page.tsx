'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { taskApi } from '@/entities/task/api/task-api';
import { TaskCard } from '@/widgets/task-card/ui/task-card';
import { Button } from '@/components/ui/button';
import type { Task } from '@/entities/task/model/types';

export default function TaskViewPage() {
  const params = useParams();
  const taskId = Number(params.id);

  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isNaN(taskId)) {
      setError('Некорректный ID задания');
      return;
    }

    taskApi
      .getById(taskId)
      .then(setTask)
      .catch(() => setError('Задание не найдено'));
  }, [taskId]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!task) return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-4" asChild>
        <Link href="/tasks">← Вернуться к банку заданий</Link>
      </Button>
      <TaskCard task={task} index={task.id} />
    </div>
  );
}
