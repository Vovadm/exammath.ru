'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api, { Variant } from '@/lib/api';
import { TaskCard } from '@/components/task-card';
import { useAuth } from '@/lib/auth-context';

export default function VariantPage() {
  const { user } = useAuth();
  const params = useParams();
  const [variant, setVariant] = useState<Variant | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    api
      .get<Variant>(`/variants/${params.id}`)
      .then((r) => setVariant(r.data))
      .catch(() => setError('Не удалось загрузить вариант'));
  }, [params.id]);

  if (!user) return <div className="text-center py-20">Войдите в аккаунт</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!variant)
    return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{variant.title}</h1>
      {variant.description && (
        <p className="text-gray-500 mb-6">{variant.description}</p>
      )}
      <p className="text-sm text-gray-500 mb-6">Заданий: {variant.tasks.length}</p>

      {variant.tasks.map((task, i) => (
        <TaskCard key={task.id} task={task} index={i + 1} />
      ))}
    </div>
  );
}
