import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { HistoryItem } from '@/entities/user/api/profile-api';

interface HistoryListProps {
  history: HistoryItem[];
}

export function HistoryList({ history }: HistoryListProps) {
  if (history.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold">Последние ответы</h2>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 text-sm border-b pb-2"
            >
              <span className={item.is_correct ? 'text-green-600' : 'text-red-500'}>
                {item.is_correct ? '✓' : '✗'}
              </span>
              <span className="text-gray-700">Задание #{item.task_id}</span>
              <span className="text-gray-500">Ответ: {item.answer ?? '—'}</span>
              <span className="text-gray-400 ml-auto">
                {new Date(item.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
