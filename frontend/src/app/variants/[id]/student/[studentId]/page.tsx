'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { VariantStudentView, API_BASE } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function StudentVariantViewPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<VariantStudentView | null>(null);
  const [error, setError] = useState('');

  const variantId = params.id as string;
  const studentId = params.studentId as string;

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'teacher') {
      router.push('/');
      return;
    }
    api
      .get<VariantStudentView>(`/variants/${variantId}/student-view/${studentId}`)
      .then((r) => setData(r.data))
      .catch(() => setError('Не удалось загрузить данные'));
  }, [user, variantId, studentId, router]);

  if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
    return <div className="text-center py-20 text-red-500">Нет доступа</div>;
  }

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          ← Назад
        </Button>
        <h1 className="text-2xl font-bold">
          {data.variant.title} — {data.student.username}
        </h1>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4 flex gap-6 text-sm">
          <div>
            <span className="text-gray-500">Ученик: </span>
            <span className="font-medium">{data.student.username}</span>
          </div>
          <div>
            <span className="text-gray-500">Email: </span>
            <span>{data.student.email}</span>
          </div>
          <div>
            <span className="text-gray-500">Заданий: </span>
            <span>{data.task_views.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Решено: </span>
            <span>{data.task_views.filter((tv) => tv.solution).length}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {data.task_views.map((tv, idx) => (
          <Card key={tv.task.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  Задание {idx + 1} (тип {tv.task.task_type})
                </h2>
                {tv.solution ? (
                  <Badge
                    className={
                      tv.solution.is_correct
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {tv.solution.is_correct ? 'Верно' : 'Неверно'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Не решено</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">{tv.task.text}</p>

              {tv.solution ? (
                <div className="bg-gray-50 rounded p-3 text-sm space-y-2">
                  <div>
                    <span className="text-gray-500">Ответ ученика: </span>
                    <span className="font-medium">{tv.solution.answer ?? '—'}</span>
                  </div>
                  {tv.task.answer && (
                    <div>
                      <span className="text-gray-500">Правильный ответ: </span>
                      <span className="font-medium text-green-700">
                        {tv.task.answer}
                      </span>
                    </div>
                  )}
                  {tv.solution.files && tv.solution.files.length > 0 && (
                    <div>
                      <p className="text-gray-500 mb-1">Прикреплённые файлы:</p>
                      <div className="flex flex-wrap gap-2">
                        {tv.solution.files.map((f) => (
                          <a
                            key={f.id}
                            href={`${API_BASE}/${f.filepath}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 underline text-xs"
                          >
                            {f.filename}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Ученик не решал это задание
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
