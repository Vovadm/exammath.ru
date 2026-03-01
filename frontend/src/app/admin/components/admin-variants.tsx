'use client';

import { useState } from 'react';
import api, { Task, TaskListResponse } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AdminVariants() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskIds, setTaskIds] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchTasks = async () => {
    if (!searchQuery.trim()) return;
    try {
      const r = await api.get<TaskListResponse>('/tasks', {
        params: { search: searchQuery, per_page: 20 },
      });
      setSearchResults(r.data.tasks);
    } catch {
      /* */
    }
  };

  const addTask = (task: Task) => {
    if (!selectedTasks.find((t) => t.id === task.id)) {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const removeTask = (taskId: number) => {
    setSelectedTasks(selectedTasks.filter((t) => t.id !== taskId));
  };

  const createVariant = async () => {
    setError('');
    setSuccess('');
    if (!title.trim()) {
      setError('Введите название');
      return;
    }
    let ids = selectedTasks.map((t) => t.id);
    if (taskIds.trim()) {
      const manual = taskIds
        .split(',')
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      ids = [...ids, ...manual];
    }
    if (ids.length === 0) {
      setError('Добавьте хотя бы одно задание');
      return;
    }
    try {
      await api.post('/variants', {
        title,
        description: description || null,
        task_ids: ids,
      });
      setSuccess(`Вариант "${title}" создан!`);
      setTitle('');
      setDescription('');
      setTaskIds('');
      setSelectedTasks([]);
      setSearchResults([]);
    } catch {
      setError('Ошибка создания варианта');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Создать вариант</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Название</Label>
          <Input
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            placeholder="Вариант 1 — тренировочный"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Описание (необязательно)</Label>
          <textarea
            className="w-full min-h-[60px] p-3 border rounded-lg text-sm resize-y mt-1"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
          />
        </div>
        <div>
          <Label>Поиск заданий</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Поиск по тексту задания..."
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && searchTasks()}
              className="flex-1"
            />
            <Button variant="outline" onClick={searchTasks}>
              Найти
            </Button>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((task) => {
              const isSelected = selectedTasks.some((t) => t.id === task.id);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono text-gray-400 mr-2">
                      #{task.id}
                    </span>
                    <Badge variant="outline" className="mr-2">
                      №{task.task_type}
                    </Badge>
                    <span className="text-sm text-gray-700">
                      {task.text.substring(0, 80)}...
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={isSelected ? 'secondary' : 'outline'}
                    onClick={() => (isSelected ? removeTask(task.id) : addTask(task))}
                  >
                    {isSelected ? '✓' : '+'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {selectedTasks.length > 0 && (
          <div>
            <Label>Выбрано ({selectedTasks.length})</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {selectedTasks.map((task, i) => (
                <Badge
                  key={task.id}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-100 transition"
                  onClick={() => removeTask(task.id)}
                >
                  {i + 1}. #{task.id} (№{task.task_type}) ✕
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Или ID заданий вручную (через запятую)</Label>
          <Input
            value={taskIds}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTaskIds(e.target.value)
            }
            placeholder="1, 5, 12, 34"
            className="mt-1"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm font-semibold">{success}</p>}

        <Button
          onClick={createVariant}
          className="bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Создать вариант
        </Button>
      </CardContent>
    </Card>
  );
}
