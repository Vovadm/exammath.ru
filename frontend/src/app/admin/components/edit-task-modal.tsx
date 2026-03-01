'use client';

import { useEffect, useState } from 'react';
import api, { Task, TYPE_NAMES } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatMath } from '@/lib/math-format';

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTaskModal({ task, onClose, onSaved }: EditTaskModalProps) {
  const isPart2Default = task.task_type >= 13 && task.task_type <= 19;
  const [text, setText] = useState(task.text);
  const [answer, setAnswer] = useState(task.answer || '');
  const [taskType, setTaskType] = useState(task.task_type);
  const [hint, setHint] = useState(task.hint || '');
  const [hasAnswer, setHasAnswer] = useState(isPart2Default ? !!task.answer : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const newIsPart2 = taskType >= 13 && taskType <= 19;
    if (newIsPart2 && !answer) {
      setHasAnswer(false);
    } else if (!newIsPart2) {
      setHasAnswer(true);
    }
  }, [taskType]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.put(`/admin/tasks/${task.id}`, {
        text,
        answer: hasAnswer ? answer || null : null,
        task_type: taskType,
        hint: hint || null,
      });
      onSaved();
    } catch {
      setError('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="font-bold text-lg">
            Редактирование #{task.id} ({task.fipi_id})
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Тип задания</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Array.from({ length: 19 }, (_, i) => i + 1).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={taskType === t ? 'default' : 'outline'}
                  onClick={() => setTaskType(t)}
                  title={TYPE_NAMES[t]}
                >
                  {t}
                </Button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              №{taskType} — {TYPE_NAMES[taskType] || '???'}
            </p>
          </div>
          <div>
            <Label>Текст задания</Label>
            <textarea
              className="w-full min-h-[150px] p-3 border rounded-lg text-sm resize-y mt-1"
              value={text}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setText(e.target.value)
              }
            />
          </div>
          <div>
            <Label>Предпросмотр</Label>
            <div
              className="p-3 bg-gray-50 rounded-lg text-sm leading-7 mt-1"
              dangerouslySetInnerHTML={{ __html: formatMath(text) }}
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAnswer}
                onChange={(e) => setHasAnswer(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Поле ответа (краткий ответ)</span>
            </label>
            <span className="text-xs text-gray-400">
              {taskType >= 13 && taskType <= 19
                ? 'По умолчанию выкл. для заданий 13-19'
                : 'По умолчанию вкл. для заданий 1-12'}
            </span>
          </div>

          {hasAnswer && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Правильный ответ</Label>
                <Input
                  value={answer}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAnswer(e.target.value)
                  }
                  placeholder="29"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Подсказка</Label>
                <Input
                  value={hint}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHint(e.target.value)
                  }
                  placeholder="Впишите правильный ответ."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {!hasAnswer && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Подсказка</Label>
                <Input
                  value={hint}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setHint(e.target.value)
                  }
                  placeholder="Впишите правильный ответ."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {saving ? '...' : 'Сохранить'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
