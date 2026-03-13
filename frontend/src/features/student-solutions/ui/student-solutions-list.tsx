'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { API_BASE } from '@/shared/api/http';
import { solutionApi } from '@/entities/solution/api/solution-api';
import type { Solution } from '@/entities/solution/model/types';

interface StudentSolutionsListProps {
  taskId: number;
}

export function StudentSolutionsList({ taskId }: StudentSolutionsListProps) {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    try {
      const data = await solutionApi.getAll(taskId);
      setSolutions(data);
      setOpen(true);
    } catch {
      alert('Ошибка загрузки решений');
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={load}>
        👁 Решения учеников
      </Button>
    );
  }

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-semibold text-blue-800">
          Решения учеников ({solutions.length})
        </p>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Закрыть
        </Button>
      </div>
      <div className="space-y-3">
        {solutions.map((s) => (
          <div key={s.id} className="p-3 bg-white rounded border">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{s.username}</span>
              {s.answer && (
                <Badge variant={s.is_correct ? 'default' : 'secondary'}>
                  {s.answer} {s.is_correct ? '✅' : s.is_correct === false ? '❌' : ''}
                </Badge>
              )}
              <span className="text-xs text-gray-400">
                {new Date(s.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
            {s.content?.map((c, i) =>
              c.type === 'text' && c.value ? (
                <p key={i} className="text-sm text-gray-700 mt-1">
                  {c.value}
                </p>
              ) : null,
            )}
            {s.files?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {s.files.map((f) => (
                  <img
                    key={f.id}
                    src={`${API_BASE}/uploads/${f.filepath}`}
                    alt="Решение ученика"
                    className="max-h-32 rounded border"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
