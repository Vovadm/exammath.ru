'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { TypeStatItem, UserStats } from '@/lib/api';
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

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStatItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    api.get<UserStats>('/profile/stats').then((r) => setStats(r.data));
    api.get<TypeStatItem[]>('/profile/type-stats').then((r) => setTypeStats(r.data));
    api.get<HistoryItem[]>('/profile/history').then((r) => setHistory(r.data));
  }, [user]);

  if (!user) return <div className="text-center py-20">Войдите в аккаунт</div>;

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'Админ';
    if (role === 'teacher') return 'Учитель';
    return 'Ученик';
  };

  const handleDeleteAccount = async () => {
    await api.delete('/profile/me');
    logout();
    router.push('/');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await api.post('/profile/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch {
      setPasswordError('Неверный текущий пароль');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-indigo-600">{user.username}</p>
            <Badge className="mt-2">{getRoleName(user.role)}</Badge>
          </CardContent>
        </Card>

        {stats && (
          <>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-green-600">{stats.accuracy}%</p>
                <p className="text-sm text-gray-500 mt-1">Точность</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.correct_attempts} из {stats.total_attempts} попыток
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

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-bold">Настройки аккаунта</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <button className="button" onClick={() => setShowPasswordForm((v) => !v)}>
              Сменить пароль
            </button>
            {showPasswordForm && (
              <div className="mt-4 flex flex-col gap-2 max-w-xs">
                {passwordError && (
                  <p className="text-red-500 text-sm">{passwordError}</p>
                )}
                {passwordSuccess && (
                  <p className="text-green-500 text-sm">{passwordSuccess}</p>
                )}
                <input
                  className="border rounded px-3 py-2 text-sm"
                  type="password"
                  placeholder="Текущий пароль"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  className="border rounded px-3 py-2 text-sm"
                  type="password"
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button className="button suggested" onClick={handleChangePassword}>
                  Сохранить
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              className="button"
              style={{ color: 'red' }}
              onClick={() => setShowDeleteModal(true)}
            >
              Удалить аккаунт
            </button>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col gap-4 shadow-xl max-w-xs w-full">
            <p className="font-semibold text-center">
              Вы уверены, что хотите удалить аккаунт?
            </p>
            <p className="text-sm text-gray-500 text-center">
              Это действие необратимо.
            </p>
            <div className="flex gap-3 justify-center">
              <button className="button" onClick={() => setShowDeleteModal(false)}>
                Отмена
              </button>
              <button
                className="button"
                style={{ color: 'white', backgroundColor: 'red' }}
                onClick={handleDeleteAccount}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
