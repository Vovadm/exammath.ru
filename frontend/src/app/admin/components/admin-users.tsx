'use client';

import { useEffect, useState } from 'react';
import api, { User } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api
      .get<User[]>('/admin/users')
      .then((r) => setUsers(r.data))
      .catch(() => {});
  }, []);

  const changeRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${role}`);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: role as User['role'] } : u)),
      );
    } catch {
      alert('Ошибка');
    }
  };

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <Card key={u.id}>
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${u.id}`}
                className="font-semibold text-indigo-600 hover:underline"
              >
                {u.username}
              </Link>
              <span className="text-sm text-gray-500">{u.email}</span>
              <Badge variant="outline">{u.role}</Badge>
            </div>
            <div className="flex gap-1">
              {(['student', 'teacher', 'admin'] as const).map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={u.role === role ? 'default' : 'outline'}
                  onClick={() => changeRole(u.id, role)}
                  disabled={u.role === role}
                >
                  {role === 'student'
                    ? 'Ученик'
                    : role === 'teacher'
                      ? 'Учитель'
                      : 'Админ'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
