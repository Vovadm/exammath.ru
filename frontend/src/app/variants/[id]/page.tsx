'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { variantApi } from '@/entities/variant/api/variant-api';
import { TaskCard } from '@/widgets/task-card/ui/task-card';
import type { Variant } from '@/entities/variant/model/types';

export default function VariantViewPage() {
  const { user } = useAuth();
  const params = useParams();
  const variantId = Number(params.id);

  const [variant, setVariant] = useState<Variant | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    if (isNaN(variantId)) {
      setError('Некорректный ID варианта');
      return;
    }

    variantApi
      .getById(variantId)
      .then(setVariant)
      .catch(() => setError('Вариант не найден'));
  }, [user, variantId]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!variant)
    return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{variant.title}</h1>
        {variant.description && <p className="text-gray-500">{variant.description}</p>}
      </div>

      <div className="flex flex-col gap-6">
        {variant.tasks.map((task, idx) => (
          <TaskCard key={task.id} task={task} index={idx + 1} />
        ))}
      </div>
    </div>
  );
}
