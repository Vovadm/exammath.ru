'use client';

import { TypeStatItem, TYPE_NAMES } from '@/lib/api';

interface StatsChartProps {
  items: TypeStatItem[];
}

function BarChart({
  data,
  maxValue,
  label,
  colorClass,
  height,
}: {
  data: { type: number; value: number }[];
  maxValue: number;
  label: string;
  colorClass: string;
  height: number;
}) {
  return (
    <div className="flex flex-col gap-2 items-center">
      <p className="text-sm font-medium text-center">{label}</p>
      <div className="flex items-end gap-1" style={{ height: `${height}px` }}>
        {data.map(({ type, value }) => {
          const barHeight = maxValue > 0 ? Math.round((value / maxValue) * height) : 0;
          return (
            <div
              key={type}
              className="flex flex-col items-center gap-1"
              style={{ width: '20px' }}
            >
              <div
                className="flex justify-end"
                style={{ height: `${height}px`, width: '6px' }}
              >
                <div
                  className={`w-full ${colorClass} rounded-t`}
                  style={{ height: `${barHeight}px`, alignSelf: 'flex-end' }}
                  title={`Тип ${type}: ${value}`}
                />
              </div>
              <span className="text-xs text-gray-500">{type}</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 flex-wrap justify-center max-w-xs">
        {data
          .filter((d) => d.value > 0)
          .slice(0, 5)
          .map(({ type }) => (
            <span key={type} className="text-xs text-gray-400">
              {type}: {TYPE_NAMES[type] ?? `Тип ${type}`}
            </span>
          ))}
      </div>
    </div>
  );
}

export default function StatsChart({ items }: StatsChartProps) {
  if (!items || items.length === 0) {
    return <p className="text-gray-500 text-sm text-center">Нет данных для графика</p>;
  }

  const allTypes = Array.from({ length: 27 }, (_, i) => i + 1);
  const chartHeight = 230;

  const attemptsData = allTypes.map((t) => {
    const found = items.find((i) => i.task_type === t);
    return { type: t, value: found ? found.attempts : 0 };
  });

  const successData = allTypes.map((t) => {
    const found = items.find((i) => i.task_type === t);
    return { type: t, value: found ? found.success_rate : 0 };
  });

  const maxAttempts = Math.max(...attemptsData.map((d) => d.value), 1);

  return (
    <div className="flex flex-wrap gap-10 justify-center overflow-x-auto py-2">
      <BarChart
        data={attemptsData}
        maxValue={maxAttempts}
        label="Задач решено (по типу задания)"
        colorClass="bg-indigo-500"
        height={chartHeight}
      />
      <BarChart
        data={successData}
        maxValue={100}
        label="Успешность решения задач (по типу задания)"
        colorClass="bg-green-500"
        height={chartHeight}
      />
    </div>
  );
}
