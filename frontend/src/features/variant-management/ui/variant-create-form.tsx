'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { SchoolClass } from '@/entities/user/model/types';
import type { VariantCreate } from '@/entities/variant/api/variant-api';

interface VariantCreateFormProps {
  classes: SchoolClass[];
  createMsg: string;
  createLoading: boolean;
  onSubmit: (data: VariantCreate) => Promise<boolean>;
  onSuccess?: () => void;
}

export function VariantCreateForm({
  classes,
  createMsg,
  createLoading,
  onSubmit,
  onSuccess,
}: VariantCreateFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskIdsRaw, setTaskIdsRaw] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = async () => {
    const taskIds = taskIdsRaw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    const ok = await onSubmit({
      title,
      description: description || undefined,
      task_ids: taskIds,
      class_id: selectedClassId,
      is_public: isPublic,
    });

    if (ok) {
      setTitle('');
      setDescription('');
      setTaskIdsRaw('');
      setSelectedClassId(null);
      setIsPublic(false);
      onSuccess?.();
    }
  };

  return (
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
          onClick={handleSubmit}
          disabled={createLoading || !title || !taskIdsRaw}
        >
          {createLoading ? 'Создаём...' : 'Создать'}
        </Button>
      </CardContent>
    </Card>
  );
}
