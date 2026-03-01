'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { User, UserStats, TYPE_NAMES } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format-date';

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');

  const userId = params.id as string;

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
      .get<HistoryItem[]>(`/profile/user/${userId}/history`)
      .then((r) => setHistory(r.data))
      .catch(() => {});
  }, [userId]);

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

      {stats && Object.keys(stats.stats_by_type).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-bold">Статистика по типам</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.stats_by_type)
                .sort(([a], [b]) => +a - +b)
                .map(([typeKey, data]) => {
                  const typeNum = parseInt(typeKey);
                  const accuracy =
                    data.attempts > 0
                      ? Math.round((data.correct / data.attempts) * 100)
                      : 0;
                  return (
                    <div
                      key={typeKey}
                      className="p-3 bg-gray-50 rounded-lg text-center"
                    >
                      <p className="text-xs text-gray-500">
                        №{typeKey} {TYPE_NAMES[typeNum] || '???'}
                      </p>
                      <p className="text-lg font-bold">{accuracy}%</p>
                      <p className="text-xs text-gray-400">
                        {data.correct}/{data.attempts}
                      </p>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-bold">Последние ответы</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <span className="text-sm">
                    Задание #{item.task_id} — &quot;{item.answer}&quot;
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${item.is_correct ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {item.is_correct ? '✅' : '❌'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
