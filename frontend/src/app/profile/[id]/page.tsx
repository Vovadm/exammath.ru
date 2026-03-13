'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { profileApi } from '@/entities/user/api/profile-api';
import { userApi } from '@/entities/user/api/user-api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import StatsChart from '@/components/stats-charts';
import { StatsCards } from '@/features/profile/ui/stats-cards';
import { HistoryList } from '@/features/profile/ui/history-list';
import type { User, UserStats, TypeStatItem } from '@/entities/user/model/types';
import type { HistoryItem } from '@/entities/user/api/profile-api';

export default function UserProfilePage() {
  const { user: currentUser } = useAuth();
  const params = useParams();
  const userId = Number(params.id);

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStatItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');

  const canSeeHistory =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'teacher' ||
    currentUser?.id === userId;

  useEffect(() => {
    if (!userId) return;

    userApi
      .getById(userId)
      .then((u) => setProfileUser(u as unknown as User))
      .catch(() => setError('Пользователь не найден'));

    profileApi
      .getUserStats(userId)
      .then(setStats)
      .catch(() => {});
    profileApi
      .getUserTypeStats(userId)
      .then(setTypeStats)
      .catch(() => {});

    if (canSeeHistory) {
      profileApi
        .getUserHistory(userId)
        .then(setHistory)
        .catch(() => {});
    }
  }, [userId, canSeeHistory]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!profileUser)
    return <div className="text-center py-20 text-gray-500">Загрузка...</div>;

  const isOwn = currentUser?.id === profileUser.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isOwn ? 'Личный кабинет' : `Профиль — ${profileUser.username}`}
      </h1>

      <StatsCards user={profileUser} stats={stats} showJoinDate />

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-bold">Статистика по типам задач</h2>
        </CardHeader>
        <CardContent>
          <StatsChart items={typeStats} />
        </CardContent>
      </Card>

      {canSeeHistory ? (
        <HistoryList history={history} />
      ) : (
        <p className="text-gray-400 text-sm text-center mt-4">
          История ответов доступна только самому пользователю, учителям и
          администраторам.
        </p>
      )}
    </div>
  );
}
