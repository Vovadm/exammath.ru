'use client';

import { useEffect, useState, useCallback } from 'react';
import api, { Task, TaskListResponse, TYPE_NAMES } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import EditTaskModal from './edit-task-modal';

function truncateText(text: string, max: number) {
  const clean = text
    .replace(/\[IMG:[^\]]+\]/g, '[картинка]')
    .replace(/vec\([^)]+\)/g, '→')
    .replace(/\([^/]+\/[^)]+\)/g, '(дробь)');
  return clean.length <= max ? clean : clean.substring(0, max) + '...';
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [taskType, setTaskType] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    const params: Record<string, string | number> = { page, per_page: 10 };
    if (activeFilter) {
      params.filter = activeFilter;
    } else if (taskType !== null) {
      params.task_type = taskType;
    }
    if (search) params.search = search;
    try {
      const r = await api.get<TaskListResponse>('/tasks', { params });
      setTasks(r.data.tasks);
      setTotal(r.data.total);
      setPages(r.data.pages);
    } catch {
      /* */
    }
  }, [page, taskType, activeFilter, search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFilterClick = (filter: string) => {
    if (activeFilter === filter) {
      setActiveFilter(null);
    } else {
      setActiveFilter(filter);
      setTaskType(null);
    }
    setPage(1);
  };

  const handleTypeClick = (t: number | null) => {
    setTaskType(t);
    setActiveFilter(null);
    setPage(1);
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Поиск..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearch(e.target.value)
          }
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              setPage(1);
              fetchTasks();
            }
          }}
          className="flex-1"
        />
        <Button
          onClick={() => {
            setPage(1);
            fetchTasks();
          }}
        >
          Найти
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <Button
          size="sm"
          variant={taskType === null && !activeFilter ? 'default' : 'outline'}
          onClick={() => handleTypeClick(null)}
        >
          Все
        </Button>
        {Array.from({ length: 19 }, (_, i) => i + 1).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={taskType === t && !activeFilter ? 'default' : 'outline'}
            onClick={() => handleTypeClick(t)}
            title={TYPE_NAMES[t]}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        <Button
          size="sm"
          variant={activeFilter === 'untyped' ? 'default' : 'outline'}
          className={
            activeFilter === 'untyped'
              ? 'bg-orange-600 hover:bg-orange-700'
              : 'border-orange-400 text-orange-600 hover:bg-orange-50'
          }
          onClick={() => handleFilterClick('untyped')}
        >
          ⚠️ Без типа
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'no_answer' ? 'default' : 'outline'}
          className={
            activeFilter === 'no_answer'
              ? 'bg-red-600 hover:bg-red-700'
              : 'border-red-400 text-red-600 hover:bg-red-50'
          }
          onClick={() => handleFilterClick('no_answer')}
        >
          ❌ Без ответа (1-12)
        </Button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Всего: <b>{total}</b> | Стр. {page}/{pages}
      </p>
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={() => {
            setEditingTask(null);
            fetchTasks();
          }}
        />
      )}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline">#{task.id}</Badge>
                    <Badge>
                      №{task.task_type} {TYPE_NAMES[task.task_type] || '???'}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">
                      {task.fipi_id}
                    </span>
                    {task.task_type >= 1 && task.task_type <= 12 && !task.answer && (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        ❌ нет ответа
                      </Badge>
                    )}
                    {task.answer && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        ✓ {task.answer}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {truncateText(task.text, 150)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTask(task)}
                >
                  ✏️
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            ◀
          </Button>
          <span className="flex items-center px-4 text-sm">
            {page}/{pages}
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
