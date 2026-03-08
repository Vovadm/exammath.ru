'use client';

import { ChartStats } from '@/lib/api';

interface Props {
  chartStats: ChartStats;
}

interface BarProps {
  label: string;
  value: number;
  maxValue: number;
  heightPx: number;
  altColor?: boolean;
}

function Bar({ label, value, maxValue, heightPx, altColor }: BarProps) {
  const barHeight = maxValue > 0 ? Math.round((value / maxValue) * heightPx) : 0;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: heightPx,
          width: 6,
        }}
      >
        <div
          style={{
            height: barHeight,
            width: 6,
            backgroundColor: altColor ? '#818cf8' : '#6366f1',
            borderRadius: 2,
          }}
        />
      </div>
      <p style={{ fontSize: '0.7em', textAlign: 'center', margin: 0 }}>{label}</p>
    </div>
  );
}

function YAxis({
  gridLines,
  gridLabels,
  heightPx,
}: {
  gridLines: number;
  gridLabels: number[];
  heightPx: number;
}) {
  const step = heightPx / gridLines;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        width: 30,
        height: heightPx,
        position: 'relative',
      }}
    >
      {gridLabels.map((label, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * step - 8,
            right: 4,
            fontSize: '0.75em',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function GridLines({
  gridLines,
  heightPx,
  width,
}: {
  gridLines: number;
  heightPx: number;
  width: number;
}) {
  const step = heightPx / gridLines;
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: heightPx,
        pointerEvents: 'none',
      }}
    >
      {Array.from({ length: gridLines + 1 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * step,
            left: 0,
            width: '100%',
            height: 1,
            backgroundColor: '#e5e7eb',
          }}
        />
      ))}
    </div>
  );
}

function Chart({
  title,
  data,
  maxValue,
  heightPx,
  altColor,
  gridLines,
  gridLabels,
}: {
  title: string;
  data: { key: string; value: number }[];
  maxValue: number;
  heightPx: number;
  altColor?: boolean;
  gridLines: number;
  gridLabels: number[];
}) {
  const barsWidth = data.length * 25;
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>{title}</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 4,
          fontSize: '0.8em',
        }}
      >
        <YAxis gridLines={gridLines} gridLabels={gridLabels} heightPx={heightPx} />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 0,
          }}
        >
          <GridLines gridLines={gridLines} heightPx={heightPx} width={barsWidth} />
          {data.map((item) => (
            <Bar
              key={item.key}
              label={item.key}
              value={item.value}
              maxValue={maxValue}
              heightPx={heightPx}
              altColor={altColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function StatsCharts({ chartStats }: Props) {
  const { solved_by_type, success_rate_by_type } = chartStats;

  const solvedEntries = Object.entries(solved_by_type).map(([k, v]) => ({
    key: `${k}`,
    value: v,
  }));
  const successEntries = Object.entries(success_rate_by_type).map(([k, v]) => ({
    key: `${k}`,
    value: v,
  }));

  const maxSolved = Math.max(...solvedEntries.map((e) => e.value), 1);
  const solvedGridMax = Math.ceil(maxSolved / 5) * 5 || 5;
  const solvedGridLines = 5;
  const solvedLabels = Array.from({ length: solvedGridLines + 1 }, (_, i) =>
    Math.round((solvedGridLines - i) * (solvedGridMax / solvedGridLines)),
  );

  const successGridLines = 10;
  const successLabels = Array.from(
    { length: successGridLines + 1 },
    (_, i) => (successGridLines - i) * 10,
  );

  if (solvedEntries.length === 0 && successEntries.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 40,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {solvedEntries.length > 0 && (
          <Chart
            title="Задач решено (по типу задания)"
            data={solvedEntries}
            maxValue={solvedGridMax}
            heightPx={230}
            gridLines={solvedGridLines}
            gridLabels={solvedLabels}
          />
        )}
        {successEntries.length > 0 && (
          <Chart
            title="Успешность решения задач (%)"
            data={successEntries}
            maxValue={100}
            heightPx={230}
            altColor
            gridLines={successGridLines}
            gridLabels={successLabels}
          />
        )}
      </div>
    </div>
  );
}
