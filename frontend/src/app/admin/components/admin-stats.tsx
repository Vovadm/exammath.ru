'use client';

import { useEffect, useState } from 'react';
import api, { TYPE_NAMES } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AdminStatsData {
  total_tasks: number;
  total_users: number;
  tasks_by_type: Record<string, number>;
}

export default function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null);

  useEffect(() => {
    api
      .get<AdminStatsData>('/admin/stats')
      .then((r) => setStats(r.data))
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
              .map(([typeKey, count]) => {
                const typeNum = parseInt(typeKey);
                return (
                  <div key={typeKey} className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-gray-500">
                      №{typeKey} {TYPE_NAMES[typeNum] || '???'}
                    </p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
