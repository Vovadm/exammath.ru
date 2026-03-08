'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { API_BASE, TYPE_NAMES, Variant, VariantStudentSolution } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function VariantStudentViewPage() {
  const { user } = useAuth();
  const params = useParams();
  const variantId = params.id as string;
  const studentId = params.studentId as string;

  const [variant, setVariant] = useState<Variant | null>(null);
  const [solutions, setSolutions] = useState<VariantStudentSolution[]>([]);
  const [studentName, setStudentName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'teacher') {
      setError('Нет доступа');
      return;
    }

    api
      .get<Variant>(`/variants/${variantId}`)
      .then((r) => setVariant(r.data))
      .catch(() => setError('Вариант не найден'));

    api
      .get<{ username: string }>(`/profile/user/${studentId}`)
      .then((r) => setStudentName(r.data.username))
      .catch(() => {});

    api
      .get<VariantStudentSolution[]>(
        `/variants/${variantId}/student/${studentId}/solutions`,
      )
      .then((r) => setSolutions(r.data))
      .catch(() => setError('Ошибка загрузки решений'));
  }, [user, variantId, studentId]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!variant)
    return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{variant.title}</h1>
      <p className="text-gray-500 mb-6">
        Ответы ученика: <strong>{studentName || `#${studentId}`}</strong>
      </p>

      <div className="flex flex-col gap-4">
        {solutions.map((sol, idx) => (
          <Card key={sol.task_id}>
            <CardHeader>
              <h2 className="font-semibold">
                Задание {idx + 1} —{' '}
                {TYPE_NAMES[sol.task_type] ?? `Тип ${sol.task_type}`}
              </h2>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Ответ:</span>
                <span className="font-mono text-sm">
                  {sol.answer ?? <em className="text-gray-400">не указан</em>}
                </span>
                {sol.is_correct !== undefined && sol.is_correct !== null && (
                  <span className={sol.is_correct ? 'text-green-600' : 'text-red-500'}>
                    {sol.is_correct ? '✓ Верно' : '✗ Неверно'}
                  </span>
                )}
              </div>

              {sol.content && sol.content.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Решение:</p>
                  {sol.content.map((c, i) => (
                    <div key={i} className="text-sm text-gray-700">
                      {c.type === 'text' && <p>{c.value}</p>}
                    </div>
                  ))}
                </div>
              )}

              {sol.files && sol.files.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Файлы:</p>
                  <div className="flex flex-wrap gap-2">
                    {sol.files.map((f) => (
                      <a
                        key={f.id}
                        href={`${API_BASE}/uploads/${f.filepath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-600 hover:underline border rounded px-2 py-1"
                      >
                        {f.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!sol.answer && (!sol.content || sol.content.length === 0) && (
                <p className="text-sm text-gray-400 italic">
                  Ученик не приступал к заданию
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
