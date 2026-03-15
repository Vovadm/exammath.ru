import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserStats } from '@/entities/user/model/types';
import type { User } from '@/entities/user/model/types';

const ROLE_NAMES: Record<string, string> = {
  admin: 'Админ',
  teacher: 'Учитель',
  student: 'Ученик',
};

interface StatsCardsProps {
  user: User;
  stats: UserStats | null;
  showJoinDate?: boolean;
}

export function StatsCards({ user, stats, showJoinDate }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-3xl font-bold text-indigo-600">{user.username}</p>
          <Badge className="mt-2">{ROLE_NAMES[user.role] ?? user.role}</Badge>
          {showJoinDate && (
            <p className="text-xs text-gray-400 mt-2">
              С {new Date(user.created_at).toLocaleDateString('ru-RU')}
            </p>
          )}
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
              <p className="text-4xl font-bold text-purple-600">{stats.tasks_solved}</p>
              <p className="text-sm text-gray-500 mt-1">Задач решено</p>
              <p className="text-xs text-gray-400 mt-1">
                Серия: {stats.streak_current} (макс: {stats.streak_max})
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
