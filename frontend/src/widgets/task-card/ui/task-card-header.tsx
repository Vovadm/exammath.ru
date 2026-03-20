import Link from 'next/link';
import { CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/entities/task/model/types';
import { TYPE_NAMES, PART2_TYPES } from '@/shared/config/task-types';

interface TaskCardHeaderProps {
  task: Task;
  index: number;
}

export function TaskCardHeader({ task, index }: TaskCardHeaderProps) {
  const isPart2 = PART2_TYPES.has(task.task_type);
  const typeName = TYPE_NAMES[task.task_type] ?? '???';

  return (
    <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between py-3 px-5">
      <span className="font-bold text-indigo-600">Задание #{index}</span>
      <div className="flex gap-2 items-center">
        <Badge variant={isPart2 ? 'secondary' : 'default'}>
          №{task.task_type} {typeName}
        </Badge>
        {task.images?.length > 0 && <Badge variant="outline">📷</Badge>}
        {task.tables?.length > 0 && <Badge variant="outline">📊</Badge>}
        <Link
          href={`/tasks/${task.id}`}
          className="text-xs text-gray-400 font-mono hover:underline hover:text-indigo-600 transition-colors"
        >
          {task.fipi_id}
        </Link>
      </div>
    </CardHeader>
  );
}
