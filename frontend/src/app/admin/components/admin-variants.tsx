'use client';

import { useEffect, useState } from 'react';
import api, { SchoolClass, Variant } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function AdminVariants() {
  const router = useRouter();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [tab, setTab] = useState<'variants' | 'create'>('variants');
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskIdsRaw, setTaskIdsRaw] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    api.get<Variant[]>('/teacher/variants').then((r) => setVariants(r.data));
    api.get<SchoolClass[]>('/teacher/classes').then((r) => setClasses(r.data));
  }, []);

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
    <div className="space-y-4">
      <div className="flex gap-3 mb-4">
        <Button
          variant={tab === 'variants' ? 'default' : 'outline'}
          onClick={() => setTab('variants')}
        >
          Все варианты
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
          {variants.map((v) => {
            const variantClass = classes.find((c) => c.id === v.class_id);
            const students = variantClass?.members ?? [];
            const isExpanded = expandedVariant === v.id;

            return (
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
                          Класс: {variantClass?.name ?? v.class_id}
                        </Badge>
                      )}
                      <Badge variant="outline">{v.tasks.length} заданий</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/variants/${v.id}`)}
                    >
                      Открыть
                    </Button>
                    {students.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedVariant(isExpanded ? null : v.id)}
                      >
                        Ответы учеников
                      </Button>
                    )}
                  </div>
                </CardContent>
                {isExpanded && students.length > 0 && (
                  <CardContent className="pt-0 pb-4">
                    <p className="text-xs text-gray-500 mb-2">Выберите ученика:</p>
                    <div className="flex flex-wrap gap-2">
                      {students.map((s) => (
                        <Button
                          key={s.user_id}
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            router.push(`/variants/${v.id}/student/${s.user_id}`)
                          }
                        >
                          {s.username}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
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
