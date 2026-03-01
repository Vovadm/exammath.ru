'use client';

import { useEffect, useState, useCallback } from 'react';
import api, { Task, TaskListResponse, TYPE_NAMES } from '@/lib/api';
import { TaskCard } from '@/components/task-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [taskType, setTaskType] = useState<number | null>(null);

  const fetchTasks = useCallback(async () => {
    const params: Record<string, string | number> = { page, per_page: 10 };
    if (taskType !== null) params.task_type = taskType;
    if (search) params.search = search;
    const r = await api.get<TaskListResponse>('/tasks', { params });
    setTasks(r.data.tasks);
    setTotal(r.data.total);
    setPages(r.data.pages);
  }, [page, taskType, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = () => {
    setPage(1);
    fetchTasks();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Банк заданий</h1>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="🔍 Поиск по тексту..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch}>Найти</Button>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2 font-semibold">Тип задания:</p>
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant={taskType === null ? 'default' : 'outline'}
            onClick={() => {
              setTaskType(null);
              setPage(1);
            }}
          >
            Все
          </Button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={taskType === t ? 'default' : 'outline'}
              onClick={() => {
                setTaskType(t);
                setPage(1);
              }}
              title={TYPE_NAMES[t]}
            >
              {t}
            </Button>
          ))}
          <div className="w-px bg-gray-300 mx-1" />
          {Array.from({ length: 7 }, (_, i) => i + 13).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={taskType === t ? 'default' : 'outline'}
              className={taskType === t ? 'bg-purple-600' : 'border-dashed'}
              onClick={() => {
                setTaskType(t);
                setPage(1);
              }}
              title={TYPE_NAMES[t]}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Показано: <b>{tasks.length}</b> из {total}
      </p>

      {tasks.map((task, i) => (
        <TaskCard key={task.id} task={task} index={(page - 1) * 10 + i + 1} />
      ))}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ◀
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {page} / {pages}
          </span>
          <Button
            variant="outline"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            ▶
          </Button>
        </div>
      )}
    </div>
  );
}
