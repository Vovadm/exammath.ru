'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  adminApi,
  type AdminStats as AdminStatsType,
} from '@/entities/admin/api/admin-api';
import { TYPE_NAMES } from '@/shared/config/task-types';

export default function AdminStatsComponent() {
  const [stats, setStats] = useState<AdminStatsType | null>(null);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return <div className="text-gray-500">Загрузка...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-indigo-600">{stats.total_tasks}</p>
            <p className="text-sm text-gray-500 mt-1">Заданий в базе</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold text-purple-600">{stats.total_users}</p>
            <p className="text-sm text-gray-500 mt-1">Пользователей</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-bold">Задания по типам</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(stats.tasks_by_type)
              .sort(([a], [b]) => +a - +b)
              .map(([typeKey, count]) => (
                <div key={typeKey} className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-xs text-gray-500">
                    №{typeKey} {TYPE_NAMES[+typeKey] ?? '???'}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
