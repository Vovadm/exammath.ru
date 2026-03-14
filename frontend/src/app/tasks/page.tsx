'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { taskApi } from '@/entities/task/api/task-api';
import { TaskCard } from '@/widgets/task-card/ui/task-card';
import { TYPE_NAMES } from '@/shared/config/task-types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Task } from '@/entities/task/model/types';

function TasksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlType = searchParams.get('type');
  const initialType = urlType ? Number(urlType) : null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [taskType, setTaskType] = useState<number | null>(initialType);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await taskApi.getList({
        page,
        per_page: 10,
        task_type: taskType ?? undefined,
        search: appliedSearch || undefined,
      });
      setTasks(data.tasks);
      setTotal(data.total);
      setPages(data.pages);
    } catch (e) {
      console.error(e);
    }
  }, [page, taskType, appliedSearch]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchInput);
  };

  const selectType = (t: number | null) => {
    setTaskType(t);
    setPage(1);

    const params = new URLSearchParams(searchParams.toString());
    if (t !== null) {
      params.set('type', t.toString());
    } else {
      params.delete('type');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Банк заданий</h1>

      <div className="flex gap-3 mb-4">
        <Input
          placeholder="🔍 Поиск по тексту..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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
            onClick={() => selectType(null)}
          >
            Все
          </Button>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={taskType === t ? 'default' : 'outline'}
              onClick={() => selectType(t)}
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
              onClick={() => selectType(t)}
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

export default function TasksPage() {
  return (
    <Suspense
      fallback={<div className="text-center py-20 text-gray-500">Загрузка...</div>}
    >
      <TasksContent />
    </Suspense>
  );
}
