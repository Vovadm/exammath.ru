'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import api, { Task, TaskListResponse, TYPE_NAMES, User, SchoolClass } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatMath } from '@/lib/math-format';
import Link from 'next/link';

interface AdminStats {
  total_tasks: number;
  total_users: number;
  tasks_by_type: Record<string, number>;
}

type AdminTab = 'tasks' | 'users' | 'variants' | 'classes' | 'stats';

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('tasks');

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-20 text-gray-500">
        Доступ только для администраторов
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
      <div className="flex gap-2 mb-6 border-b pb-3 flex-wrap">
        {(
          [
            ['tasks', '📝 Задания'],
            ['users', '👥 Пользователи'],
            ['variants', '📋 Варианты'],
            ['classes', '🏫 Классы'],
            ['stats', '📊 Статистика'],
          ] as [AdminTab, string][]
        ).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === 'tasks' && <AdminTasks />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'variants' && <AdminVariants />}
      {tab === 'classes' && <AdminClasses />}
      {tab === 'stats' && <AdminStatsTab />}
    </div>
  );
}

function AdminTasks() {
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

  const truncateText = (text: string, max: number) => {
    const clean = text
      .replace(/\[IMG:[^\]]+\]/g, '[картинка]')
      .replace(/vec\([^)]+\)/g, '→')
      .replace(/\([^/]+\/[^)]+\)/g, '(дробь)');
    return clean.length <= max ? clean : clean.substring(0, max) + '...';
  };

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

function EditTaskModal({
  task,
  onClose,
  onSaved,
}: {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isPart2Default = task.task_type >= 13 && task.task_type <= 19;
  const [text, setText] = useState(task.text);
  const [answer, setAnswer] = useState(task.answer || '');
  const [taskType, setTaskType] = useState(task.task_type);
  const [hint, setHint] = useState(task.hint || '');
  const [hasAnswer, setHasAnswer] = useState(isPart2Default ? !!task.answer : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // При смене типа — обнови дефолт hasAnswer
  useEffect(() => {
    const newIsPart2 = taskType >= 13 && taskType <= 19;
    if (newIsPart2 && !answer) {
      setHasAnswer(false);
    } else if (!newIsPart2) {
      setHasAnswer(true);
    }
  }, [taskType]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/tasks/${task.id}`, {
        text,
        answer: hasAnswer ? answer || null : null,
        task_type: taskType,
        hint: hint || null,
      });
      onSaved();
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold text-lg">
            Редактирование #{task.id} ({task.fipi_id})
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Тип задания</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Array.from({ length: 19 }, (_, i) => i + 1).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={taskType === t ? 'default' : 'outline'}
                  onClick={() => setTaskType(t)}
                  title={TYPE_NAMES[t]}
                >
                  {t}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              №{taskType} — {TYPE_NAMES[taskType] || '???'}
            </p>
          </div>
          <div>
            <Label>Текст задания</Label>
            <textarea
              className="w-full min-h-[150px] p-3 border rounded-lg text-sm resize-y mt-1"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setText(e.target.value)
              }
            />
          </div>
          <div>
            <Label>Предпросмотр</Label>
            <div
              className="p-3 bg-gray-50 rounded-lg text-sm leading-7 mt-1"
              dangerouslySetInnerHTML={{ __html: formatMath(text) }}
            />
          </div>

          {/* Переключатель поля ответа */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAnswer}
                onChange={(e) => setHasAnswer(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Поле ответа (краткий ответ)</span>
            </label>
            <span className="text-xs text-gray-400">
              {taskType >= 13 && taskType <= 19
                ? 'По умолчанию выкл. для заданий 13-19'
                : 'По умолчанию вкл. для заданий 1-12'}
            </span>
          </div>

          {hasAnswer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Правильный ответ</Label>
                <Input
                  value={answer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnswer(e.target.value)
                  }
                  placeholder="29"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Подсказка</Label>
                <Input
                  value={hint}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHint(e.target.value)
                  }
                  placeholder="Впишите правильный ответ."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {!hasAnswer && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Подсказка</Label>
                <Input
                  value={hint}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHint(e.target.value)
                  }
                  placeholder="Впишите правильный ответ."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {saving ? '...' : 'Сохранить'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api
      .get<User[]>('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => {});
  }, []);

  const changeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${role}`);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: role as User['role'] } : u)),
      );
    } catch {
      alert('Ошибка');
    }
  };

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${u.id}`}
                className="font-semibold text-indigo-600 hover:underline"
              >
                {u.username}
              </Link>
              <span className="text-sm text-gray-500">{u.email}</span>
              <Badge variant="outline">{u.role}</Badge>
            </div>
            <div className="flex gap-1">
              {(['student', 'teacher', 'admin'] as const).map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={u.role === role ? 'default' : 'outline'}
                  onClick={() => changeRole(u.id, role)}
                  disabled={u.role === role}
                >
                  {role === 'student'
                    ? 'Ученик'
                    : role === 'teacher'
                      ? 'Учитель'
                      : 'Админ'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AdminVariants() {
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
      setSuccess(`Вариант "${title}" со��дан!`);
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

function AdminClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [addUserRole, setAddUserRole] = useState('student');

  const loadClasses = async () => {
    try {
      const r = await api.get<SchoolClass[]>('/classes');
      setClasses(r.data);
    } catch {
      /* */
    }
  };

  const loadUsers = async () => {
    try {
      const r = await api.get<User[]>('/admin/users');
      setAllUsers(r.data);
    } catch {
      /* */
    }
  };

  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  const createClass = async () => {
    if (!newClassName.trim()) return;
    try {
      await api.post('/classes', {
        name: newClassName,
        description: newClassDesc || null,
      });
      setNewClassName('');
      setNewClassDesc('');
      loadClasses();
    } catch {
      alert('Ошибка создания класса');
    }
  };

  const deleteClass = async (classId: number) => {
    if (!confirm('Удалить класс?')) return;
    try {
      await api.delete(`/classes/${classId}`);
      loadClasses();
    } catch {
      alert('Ошибка удаления');
    }
  };

  const addMember = async (classId: number) => {
    const userId = parseInt(addUserId);
    if (isNaN(userId)) {
      alert('Выберите пользователя');
      return;
    }
    try {
      await api.post(`/classes/${classId}/members`, {
        user_id: userId,
        role: addUserRole,
      });
      setAddUserId('');
      loadClasses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || 'Ошибка добавления');
    }
  };

  const removeMember = async (classId: number, userId: number) => {
    try {
      await api.delete(`/classes/${classId}/members/${userId}`);
      loadClasses();
    } catch {
      alert('Ошибка удаления участника');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-bold">Создать класс</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Название класса</Label>
            <Input
              value={newClassName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewClassName(e.target.value)
              }
              placeholder="11А"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Input
              value={newClassDesc}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewClassDesc(e.target.value)
              }
              placeholder="Профильная математика"
              className="mt-1"
            />
          </div>
          <Button
            onClick={createClass}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Создать
          </Button>
        </CardContent>
      </Card>

      {classes.map((sc) => (
        <Card key={sc.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{sc.name}</h2>
              {sc.description && (
                <p className="text-sm text-gray-500">{sc.description}</p>
              )}
              <p className="text-xs text-gray-400">Участников: {sc.members.length}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedClass(expandedClass === sc.id ? null : sc.id)}
              >
                {expandedClass === sc.id ? 'Свернуть' : 'Управление'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => deleteClass(sc.id)}
              >
                🗑
              </Button>
            </div>
          </CardHeader>

          {expandedClass === sc.id && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {sc.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${m.user_id}`}
                        className="font-semibold text-sm text-indigo-600 hover:underline"
                      >
                        {m.username}
                      </Link>
                      <span className="text-xs text-gray-500">{m.email}</span>
                      <Badge
                        variant={m.role === 'teacher' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {m.role === 'teacher' ? 'Учитель' : 'Ученик'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => removeMember(sc.id, m.user_id)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {sc.members.length === 0 && (
                  <p className="text-sm text-gray-400">Нет участников</p>
                )}
              </div>

              <div className="border-t pt-4">
                <Label>Добавить участника</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm flex-1"
                    value={addUserId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAddUserId(e.target.value)
                    }
                  >
                    <option value="">Выберите пользователя</option>
                    {allUsers
                      .filter((u) => !sc.members.some((m) => m.user_id === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.email}) — {u.role}
                        </option>
                      ))}
                  </select>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm w-32"
                    value={addUserRole}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAddUserRole(e.target.value)
                    }
                  >
                    <option value="student">Ученик</option>
                    <option value="teacher">Учитель</option>
                  </select>
                  <Button
                    onClick={() => addMember(sc.id)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}

function AdminStatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    api
      .get<AdminStats>('/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-indigo-600">{stats.total_tasks}</p>
            <p className="text-sm text-gray-500 mt-1">Заданий в базе</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-purple-600">{stats.total_users}</p>
            <p className="text-sm text-gray-500 mt-1">Пользователей</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-bold">Задания по типам</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.tasks_by_type)
              .sort(([a], [b]) => +a - +b)
              .map(([typeKey, count]) => {
                const typeNum = parseInt(typeKey);
                return (
                  <div key={typeKey} className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">
                      №{typeKey} {TYPE_NAMES[typeNum] || '???'}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
