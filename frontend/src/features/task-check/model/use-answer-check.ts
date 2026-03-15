import { useState } from 'react';
import {
  solutionApi,
  type CheckAnswerResponse,
} from '@/entities/solution/api/solution-api';

interface UseAnswerCheckReturn {
  answer: string;
  result: CheckAnswerResponse | null;
  setAnswer: (v: string) => void;
  check: () => Promise<void>;
}

export function useAnswerCheck(
  taskId: number,
  initialAnswer = '',
): UseAnswerCheckReturn {
  const [answer, setAnswer] = useState(initialAnswer);
  const [result, setResult] = useState<CheckAnswerResponse | null>(null);

  const check = async () => {
    if (!answer.trim()) return;
    try {
      const data = await solutionApi.check(taskId, answer.trim());
      setResult(data);
    } catch {
      alert('Ошибка проверки');
    }
  };

  return { answer, result, setAnswer, check };
}
