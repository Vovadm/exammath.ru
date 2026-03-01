'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Task, Solution, TYPE_NAMES, API_BASE } from '@/lib/api';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { formatMath } from '@/lib/math-format';

interface CheckResult {
  correct: boolean;
  correct_answer?: string;
}

export function TaskCard({ task, index }: { task: Task; index: number }) {
  const { user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [allSolutions, setAllSolutions] = useState<Solution[]>([]);
  const [showAllSolutions, setShowAllSolutions] = useState(false);
  const [solutionId, setSolutionId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [solutionFiles, setSolutionFiles] = useState<
    { id: number; filename: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeName = TYPE_NAMES[task.task_type] || '???';
  const isPart2 = task.task_type >= 13 && task.task_type <= 19;
  const showAnswerField = !isPart2 || !!task.answer;
  const isTeacherOrAdmin = user && (user.role === 'admin' || user.role === 'teacher');

  const loadMySolutions = async () => {
    try {
      const r = await api.get<Solution[]>(`/solutions/task/${task.id}`);
      if (r.data.length > 0) {
        const latest = r.data[0];
        if (latest.content && latest.content.length > 0) {
          const textBlock = latest.content.find((c) => c.type === 'text');
          if (textBlock) setSolutionText(textBlock.value);
        }
        setSolutionId(latest.id);
        if (latest.files) {
          setSolutionFiles(
            latest.files.map((f) => ({ id: f.id, filename: f.filepath })),
          );
        }
        if (latest.answer) setAnswer(latest.answer);
        if (latest.is_correct !== null && latest.is_correct !== undefined) {
          setResult({ correct: latest.is_correct });
        }
      }
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (user) {
      loadMySolutions();
    }
  }, [user, task.id]);

  const handleCheck = async () => {
    if (!user) {
      alert('Войдите чтобы проверить ответ');
      return;
    }
    if (!answer.trim()) return;
    try {
      const r = await api.post<CheckResult>('/solutions/check', {
        task_id: task.id,
        answer: answer.trim(),
      });
      setResult(r.data);
    } catch {
      alert('Ошибка проверки');
    }
  };

  const handleSaveSolution = async () => {
    if (!user) return;
    try {
      const r = await api.post<Solution>('/solutions', {
        task_id: task.id,
        answer: answer || null,
        content: [{ type: 'text', value: solutionText }],
      });
      setSolutionId(r.data.id);
      alert('Решение сохранено!');
      loadMySolutions();
    } catch {
      alert('Ошибка сохранения');
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !solutionId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      const r = await api.post(`/solutions/upload/${solutionId}`, formData);
      setSolutionFiles([
        ...solutionFiles,
        { id: r.data.id, filename: r.data.filename },
      ]);
    } catch {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveThenUpload = async () => {
    if (!solutionId) {
      try {
        const r = await api.post<Solution>('/solutions', {
          task_id: task.id,
          answer: answer || null,
          content: [{ type: 'text', value: solutionText }],
        });
        setSolutionId(r.data.id);
        fileInputRef.current?.click();
      } catch {
        alert('Сначала сохраните решение');
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const loadAllSolutions = async () => {
    try {
      const r = await api.get<Solution[]>(`/solutions/task/${task.id}/all`);
      setAllSolutions(r.data);
      setShowAllSolutions(true);
    } catch {
      alert('Ошибка загрузки решений');
    }
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gray-50 border-b flex flex-row items-center justify-between py-3 px-5">
        <span className="font-bold text-indigo-600">Задание #{index}</span>
        <div className="flex gap-2 items-center">
          <Badge variant={isPart2 ? 'secondary' : 'default'}>
            №{task.task_type} {typeName}
          </Badge>
          {task.images && task.images.length > 0 && <Badge variant="outline">📷</Badge>}
          {task.tables && task.tables.length > 0 && <Badge variant="outline">📊</Badge>}
          <span className="text-xs text-gray-400 font-mono">{task.fipi_id}</span>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div
          className="text-sm leading-8 text-gray-800"
          dangerouslySetInnerHTML={{ __html: formatMath(task.text) }}
        />

        {task.tables?.map((t: string, i: number) => (
          <div
            key={i}
            className="my-4 overflow-x-auto"
            dangerouslySetInnerHTML={{
              __html: t
                .replace('<table>', '<table class="w-full border-collapse text-sm">')
                .replace(
                  /<td/g,
                  '<td class="border border-gray-300 px-3 py-2 text-center"',
                )
                .replace(
                  /<th/g,
                  '<th class="border border-gray-300 px-3 py-2 text-center bg-indigo-50 font-semibold text-indigo-900"',
                ),
            }}
          />
        ))}

        {task.images?.map((url: string, i: number) => (
          <div key={i} className="mt-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Задание"
              className="max-w-full max-h-96 mx-auto rounded-lg border"
            />
          </div>
        ))}

        {showSolution && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <p className="text-sm font-semibold mb-2">Ваше решение:</p>
            <textarea
              className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-y"
              placeholder="Опишите ваше решение..."
              value={solutionText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setSolutionText(e.target.value)
              }
            />

            {solutionFiles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {solutionFiles.map((f) => (
                  <div key={f.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${API_BASE}/uploads/${f.filename}`}
                      alt="Файл решения"
                      className="max-h-40 rounded border"
                    />
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadImage}
            />

            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleSaveSolution}>
                💾 Сохранить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveThenUpload}
                disabled={uploading}
              >
                {uploading ? 'Загрузка...' : '📷 Добавить картинку'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSolution(false)}>
                Закрыть
              </Button>
            </div>
          </div>
        )}

        {showAllSolutions && allSolutions.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-blue-800">
                Решения учеников ({allSolutions.length})
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowAllSolutions(false)}
              >
                Закрыть
              </Button>
            </div>
            <div className="space-y-3">
              {allSolutions.map((s) => (
                <div key={s.id} className="p-3 bg-white rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{s.username}</span>
                    {s.answer && (
                      <Badge variant={s.is_correct ? 'default' : 'secondary'}>
                        {s.answer}{' '}
                        {s.is_correct ? '✅' : s.is_correct === false ? '❌' : ''}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {s.content?.map((c, ci) =>
                    c.type === 'text' && c.value ? (
                      <p key={ci} className="text-sm text-gray-700 mt-1">
                        {c.value}
                      </p>
                    ) : null,
                  )}
                  {s.files && s.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.files.map((f) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
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
        )}
      </CardContent>

      <CardFooter className="border-t px-5 py-3 flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSolution(!showSolution)}
          >
            📝 Решение
          </Button>
          {isTeacherOrAdmin && (
            <Button variant="outline" size="sm" onClick={loadAllSolutions}>
              👁 Решения учеников
            </Button>
          )}
        </div>
        {showAnswerField && (
          <div className="flex gap-2 items-center">
            {result && (
              <span
                className={`text-sm font-semibold ${result.correct ? 'text-green-600' : 'text-red-600'}`}
              >
                {result.correct
                  ? '✅ Верно!'
                  : `❌ Неверно${result.correct_answer ? ` (${result.correct_answer})` : ''}`}
              </span>
            )}
            <Input
              className="w-40"
              placeholder="Ответ"
              value={answer}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAnswer(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleCheck()}
            />
            <Button onClick={handleCheck}>Проверить</Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
