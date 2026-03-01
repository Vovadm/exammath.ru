'use client';

import { useEffect, useState } from 'react';
import api, { User, SchoolClass } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [addUserId, setAddUserId] = useState('');
  const [addUserRole, setAddUserRole] = useState('student');

  const loadClasses = async () => {
    try {
      const r = await api.get<SchoolClass[]>('/classes');
      setClasses(r.data);
    } catch {
      /* */
    }
  };

  const loadUsers = async () => {
    try {
      const r = await api.get<User[]>('/admin/users');
      setAllUsers(r.data);
    } catch {
      /* */
    }
  };

  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  const createClass = async () => {
    if (!newClassName.trim()) return;
    try {
      await api.post('/classes', {
        name: newClassName,
        description: newClassDesc || null,
      });
      setNewClassName('');
      setNewClassDesc('');
      loadClasses();
    } catch {
      alert('Ошибка создания класса');
    }
  };

  const deleteClass = async (classId: number) => {
    if (!confirm('Удалить класс?')) return;
    try {
      await api.delete(`/classes/${classId}`);
      loadClasses();
    } catch {
      alert('Ошибка удаления');
    }
  };

  const addMember = async (classId: number) => {
    const userId = parseInt(addUserId);
    if (isNaN(userId)) {
      alert('Выберите пользователя');
      return;
    }
    try {
      await api.post(`/classes/${classId}/members`, {
        user_id: userId,
        role: addUserRole,
      });
      setAddUserId('');
      loadClasses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      alert(axiosErr.response?.data?.detail || 'Ошибка добавления');
    }
  };

  const removeMember = async (classId: number, userId: number) => {
    try {
      await api.delete(`/classes/${classId}/members/${userId}`);
      loadClasses();
    } catch {
      alert('Ошибка удаления участника');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-bold">Создать класс</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Название класса</Label>
            <Input
              value={newClassName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewClassName(e.target.value)
              }
              placeholder="11А"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Описание</Label>
            <Input
              value={newClassDesc}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewClassDesc(e.target.value)
              }
              placeholder="Профильная математика"
              className="mt-1"
            />
          </div>
          <Button
            onClick={createClass}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Создать
          </Button>
        </CardContent>
      </Card>

      {classes.map((sc) => (
        <Card key={sc.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <h2 className="font-bold text-lg">{sc.name}</h2>
              {sc.description && (
                <p className="text-sm text-gray-500">{sc.description}</p>
              )}
              <p className="text-xs text-gray-400">Участников: {sc.members.length}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedClass(expandedClass === sc.id ? null : sc.id)}
              >
                {expandedClass === sc.id ? 'Свернуть' : 'Управление'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => deleteClass(sc.id)}
              >
                🗑
              </Button>
            </div>
          </CardHeader>

          {expandedClass === sc.id && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {sc.members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${m.user_id}`}
                        className="font-semibold text-sm text-indigo-600 hover:underline"
                      >
                        {m.username}
                      </Link>
                      <span className="text-xs text-gray-500">{m.email}</span>
                      <Badge
                        variant={m.role === 'teacher' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {m.role === 'teacher' ? 'Учитель' : 'Ученик'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => removeMember(sc.id, m.user_id)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {sc.members.length === 0 && (
                  <p className="text-sm text-gray-400">Нет участников</p>
                )}
              </div>

              <div className="border-t pt-4">
                <Label>Добавить участника</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm flex-1"
                    value={addUserId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAddUserId(e.target.value)
                    }
                  >
                    <option value="">Выберите пользователя</option>
                    {allUsers
                      .filter((u) => !sc.members.some((m) => m.user_id === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.email}) — {u.role}
                        </option>
                      ))}
                  </select>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm w-32"
                    value={addUserRole}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setAddUserRole(e.target.value)
                    }
                  >
                    <option value="student">Ученик</option>
                    <option value="teacher">Учитель</option>
                  </select>
                  <Button
                    onClick={() => addMember(sc.id)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
