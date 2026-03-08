'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { TypeStatItem, User, UserStats } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatsChart from '@/components/stats-charts';

interface HistoryItem {
  id: number;
  task_id: number;
  answer: string;
  is_correct: boolean;
  created_at: string;
}

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStatItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');

  const userId = params.id as string;

  const canSeeHistory =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'teacher' ||
    String(currentUser?.id) === userId;

  useEffect(() => {
    if (!userId) return;

    api
      .get<User>(`/profile/user/${userId}`)
      .then((r) => setProfileUser(r.data))
      .catch(() => setError('Пользователь не найден'));

    api
      .get<UserStats>(`/profile/user/${userId}/stats`)
      .then((r) => setStats(r.data))
      .catch(() => {});

    api
      .get<TypeStatItem[]>(`/profile/user/${userId}/type-stats`)
      .then((r) => setTypeStats(r.data))
      .catch(() => {});

    if (canSeeHistory) {
      api
        .get<HistoryItem[]>(`/profile/user/${userId}/history`)
        .then((r) => setHistory(r.data))
        .catch(() => {});
    }
  }, [userId, canSeeHistory]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!profileUser)
    return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'Админ';
    if (role === 'teacher') return 'Учитель';
    return 'Ученик';
  };

  const isOwn = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isOwn ? 'Личный кабинет' : `Профиль — ${profileUser.username}`}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-indigo-600">{profileUser.username}</p>
            <Badge className="mt-2">{getRoleName(profileUser.role)}</Badge>
            <p className="text-xs text-gray-400 mt-2">
              С {new Date(profileUser.created_at).toLocaleDateString('ru-RU')}
            </p>
          </CardContent>
        </Card>

        {stats && (
          <>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-green-600">{stats.accuracy}%</p>
                <p className="text-sm text-gray-500 mt-1">Точность</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.correct_attempts} из {stats.total_attempts}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-purple-600">
                  {stats.tasks_solved}
                </p>
                <p className="text-sm text-gray-500 mt-1">Задач решено</p>
                <p className="text-xs text-gray-400 mt-1">
                  Серия: {stats.streak_current} (макс: {stats.streak_max})
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-bold">Статистика по типам задач</h2>
        </CardHeader>
        <CardContent>
          <StatsChart items={typeStats} />
        </CardContent>
      </Card>

      {canSeeHistory && history.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-bold">Последние ответы</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 text-sm border-b pb-2"
                >
                  <span className={item.is_correct ? 'text-green-600' : 'text-red-500'}>
                    {item.is_correct ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-700">Задание #{item.task_id}</span>
                  <span className="text-gray-500">Ответ: {item.answer ?? '—'}</span>
                  <span className="text-gray-400 ml-auto">
                    {new Date(item.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!canSeeHistory && (
        <p className="text-gray-400 text-sm text-center mt-4">
          История ответов доступна только самому пользователю, учителям и
          администраторам.
        </p>
      )}
    </div>
  );
}
