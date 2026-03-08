'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import api, { SchoolClass, Variant } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function TeacherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [tab, setTab] = useState<'variants' | 'create'>('variants');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskIdsRaw, setTaskIdsRaw] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'teacher' && user.role !== 'admin') {
      router.push('/');
      return;
    }
    api.get<Variant[]>('/teacher/variants').then((r) => setVariants(r.data));
    api.get<SchoolClass[]>('/teacher/classes').then((r) => setClasses(r.data));
  }, [user, router]);

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <div className="text-center py-20 text-red-500">Нет доступа</div>;
  }

  const handleCreate = async () => {
    setCreateLoading(true);
    setCreateMsg('');
    try {
      const taskIds = taskIdsRaw
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const r = await api.post<Variant>('/teacher/variants', {
        title,
        description: description || null,
        task_ids: taskIds,
        class_id: selectedClassId,
        is_public: isPublic,
      });
      setVariants((prev) => [r.data, ...prev]);
      setTitle('');
      setDescription('');
      setTaskIdsRaw('');
      setSelectedClassId(null);
      setIsPublic(false);
      setCreateMsg('Вариант создан успешно');
      setTab('variants');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setCreateMsg(err?.response?.data?.detail || 'Ошибка при создании');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Панель учителя</h1>

      <div className="flex gap-3 mb-6">
        <Button
          variant={tab === 'variants' ? 'default' : 'outline'}
          onClick={() => setTab('variants')}
        >
          Мои варианты
        </Button>
        <Button
          variant={tab === 'create' ? 'default' : 'outline'}
          onClick={() => setTab('create')}
        >
          Создать вариант
        </Button>
      </div>

      {tab === 'variants' && (
        <div className="space-y-4">
          {variants.length === 0 && (
            <p className="text-gray-500 text-center py-10">Вариантов пока нет</p>
          )}
          {variants.map((v) => (
            <Card key={v.id}>
              <CardContent className="pt-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold">{v.title}</p>
                  {v.description && (
                    <p className="text-sm text-gray-500">{v.description}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    {v.is_public && <Badge variant="secondary">Публичный</Badge>}
                    {v.class_id && (
                      <Badge variant="outline">
                        Класс:{' '}
                        {classes.find((c) => c.id === v.class_id)?.name ?? v.class_id}
                      </Badge>
                    )}
                    <Badge variant="outline">{v.tasks.length} заданий</Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/variants/${v.id}`)}
                >
                  Открыть
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === 'create' && (
        <Card>
          <CardHeader>
            <h2 className="font-bold">Новый вариант</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 max-w-lg">
            <Input
              placeholder="Название варианта"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Описание (необязательно)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              placeholder="ID заданий через запятую: 1, 2, 3"
              value={taskIdsRaw}
              onChange={(e) => setTaskIdsRaw(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium mb-1 block">Класс</label>
              <select
                className="border rounded px-3 py-2 text-sm w-full"
                value={selectedClassId ?? ''}
                onChange={(e) =>
                  setSelectedClassId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">Без класса</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Публичный вариант
            </label>
            {createMsg && (
              <p
                className={
                  createMsg.includes('успешно')
                    ? 'text-green-600 text-sm'
                    : 'text-red-500 text-sm'
                }
              >
                {createMsg}
              </p>
            )}
            <Button
              onClick={handleCreate}
              disabled={createLoading || !title || !taskIdsRaw}
            >
              {createLoading ? 'Создаём...' : 'Создать'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
