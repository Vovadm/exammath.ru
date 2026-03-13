'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { profileApi } from '@/entities/user/api/profile-api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import StatsChart from '@/components/stats-charts';
import { StatsCards } from '@/features/profile/ui/stats-cards';
import { HistoryList } from '@/features/profile/ui/history-list';
import { AccountSettings } from '@/features/profile/ui/account-settings';
import type { UserStats, TypeStatItem } from '@/entities/user/model/types';
import type { HistoryItem } from '@/entities/user/api/profile-api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStatItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!user) return;
    profileApi
      .getMyStats()
      .then(setStats)
      .catch(() => {});
    profileApi
      .getMyTypeStats()
      .then(setTypeStats)
      .catch(() => {});
    profileApi
      .getMyHistory()
      .then(setHistory)
      .catch(() => {});
  }, [user]);

  if (!user) return <div className="text-center py-20">Войдите в аккаунт</div>;

  const handleDeleteAccount = async () => {
    await profileApi.deleteAccount();
    logout();
    router.push('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Личный кабинет</h1>

      <StatsCards user={user} stats={stats} />

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-bold">Статистика по типам задач</h2>
        </CardHeader>
        <CardContent>
          <StatsChart items={typeStats} />
        </CardContent>
      </Card>

      <AccountSettings onDeleteAccount={handleDeleteAccount} />

      <HistoryList history={history} />
    </div>
  );
}
