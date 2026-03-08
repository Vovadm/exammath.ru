'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api, { ChartStats, UserStats } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTime } from '@/lib/format-date';
import { StatsCharts } from '@/components/stats-charts';

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
  const [chartStats, setChartStats] = useState<ChartStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get<UserStats>('/profile/stats').then((r) => setStats(r.data));
    api.get<ChartStats>('/profile/chart-stats').then((r) => setChartStats(r.data));
    api.get<HistoryItem[]>('/profile/history').then((r) => setHistory(r.data));
  }, [user]);

  if (!user) return <div className="text-center py-20">Войдите в аккаунт</div>;

  const getRoleName = (role: string) => {
    if (role === 'admin') return 'Админ';
    if (role === 'teacher') return 'Учитель';
    return 'Ученик';
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/profile/me');
      logout();
      router.push('/');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordLoading(true);
    setPasswordMsg('');
    try {
      await api.put('/profile/me/password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPasswordMsg('Пароль успешно изменён');
      setOldPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setPasswordMsg(err?.response?.data?.detail || 'Ошибка при смене пароля');
    } finally {
      setPasswordLoading(false);
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
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm((v) => !v)}
              >
                Сменить пароль
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
              >
                Удалить аккаунт
              </Button>
            </div>
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

      {showPasswordForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-bold">Смена пароля</h2>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 max-w-sm">
            <Input
              type="password"
              placeholder="Текущий пароль"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {passwordMsg && (
              <p
                className={
                  passwordMsg.includes('успешно')
                    ? 'text-green-600 text-sm'
                    : 'text-red-500 text-sm'
                }
              >
                {passwordMsg}
              </p>
            )}
            <Button
              onClick={handleChangePassword}
              disabled={passwordLoading || !oldPassword || !newPassword}
            >
              {passwordLoading ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </CardContent>
        </Card>
      )}

      {chartStats && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-bold">Статистика (гистограммы)</h2>
          </CardHeader>
          <CardContent>
            <StatsCharts chartStats={chartStats} />
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-bold">История решений</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-sm border-b pb-2"
                >
                  <span>Задание #{item.task_id}</span>
                  <span className="text-gray-500">{item.answer}</span>
                  <span className={item.is_correct ? 'text-green-600' : 'text-red-500'}>
                    {item.is_correct ? '✓' : '✗'}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-bold text-lg mb-2">Удалить аккаунт?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Это действие нельзя отменить. Все ваши данные будут удалены.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Удаляем...' : 'Подтвердить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
