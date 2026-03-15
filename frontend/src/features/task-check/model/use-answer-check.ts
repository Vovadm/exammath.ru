import { useState, useEffect } from 'react';
import {
  solutionApi,
  type CheckAnswerResponse,
} from '@/entities/solution/api/solution-api';
import { toast } from 'sonner';

interface UseAnswerCheckReturn {
  answer: string;
  result: CheckAnswerResponse | null;
  setAnswer: (v: string) => void;
  check: () => Promise<void>;
}

export function useAnswerCheck(
  taskId: number,
  initialAnswer = '',
  initialCorrect: boolean | null = null,
): UseAnswerCheckReturn {
  const [answer, setAnswer] = useState(initialAnswer);
  const [result, setResult] = useState<CheckAnswerResponse | null>(
    initialCorrect !== null ? { correct: initialCorrect } : null,
  );

  useEffect(() => {
    if (initialAnswer) setAnswer(initialAnswer);
    if (initialCorrect !== null) setResult({ correct: initialCorrect });
  }, [initialAnswer, initialCorrect]);

  const check = async () => {
    if (!answer.trim()) return;
    try {
      const data = await solutionApi.check(taskId, answer.trim());
      setResult(data);
    } catch {
      toast.error('Ошибка проверки');
    }
  };

  return { answer, result, setAnswer, check };
}
