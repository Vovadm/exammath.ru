'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAnswerCheck } from '../model/use-answer-check';

interface AnswerCheckerProps {
  taskId: number;
  initialAnswer?: string;
  initialCorrect?: boolean | null;
}

export function AnswerChecker({
  taskId,
  initialAnswer,
  initialCorrect,
}: AnswerCheckerProps) {
  const { answer, result, setAnswer, check } = useAnswerCheck(
    taskId,
    initialAnswer,
    initialCorrect,
  );

  return (
    <div className="flex gap-2 items-center">
      {result && (
        <span
          className={`text-sm font-semibold ${result.correct ? 'text-green-600' : 'text-red-600'}`}
        >
          {result.correct ? '✅ Верно!' : `❌ Неверно`}
        </span>
      )}
      <Input
        className="w-40"
        placeholder="Ответ"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && check()}
      />
      <Button onClick={check}>Проверить</Button>
    </div>
  );
}
