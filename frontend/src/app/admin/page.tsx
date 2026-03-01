'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import AdminTasks from './components/admin-tasks';
import AdminUsers from './components/admin-users';
import AdminVariants from './components/admin-variants';
import AdminClasses from './components/admin-classes';
import AdminStats from './components/admin-stats';

type AdminTab = 'tasks' | 'users' | 'variants' | 'classes' | 'stats';

const TABS: [AdminTab, string][] = [
  ['tasks', '📝 Задания'],
  ['users', '👥 Пользователи'],
  ['variants', '📋 Варианты'],
  ['classes', '🏫 Классы'],
  ['stats', '📊 Статистика'],
];

export default function AdminPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<AdminTab>('tasks');

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-20 text-gray-500">
        Доступ только для администраторов
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Админ-панель</h1>
      <div className="flex gap-2 mb-6 border-b pb-3 flex-wrap">
        {TABS.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? 'default' : 'outline'}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>
      {tab === 'tasks' && <AdminTasks />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'variants' && <AdminVariants />}
      {tab === 'classes' && <AdminClasses />}
      {tab === 'stats' && <AdminStats />}
    </div>
  );
}
