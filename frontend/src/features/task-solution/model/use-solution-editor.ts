import { useState, useRef } from 'react';
import { solutionApi } from '@/entities/solution/api/solution-api';
import type { Solution } from '@/entities/solution/model/types';

interface UseSolutionEditorReturn {
  solutionText: string;
  setSolutionText: (v: string) => void;
  solutionId: number | null;
  solutionFiles: { id: number; filename: string }[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  save: (taskId: number, answer: string | null) => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerUpload: (taskId: number, answer: string | null) => Promise<void>;
  loadFromSolution: (solutions: Solution[]) => void;
}

export function useSolutionEditor(): UseSolutionEditorReturn {
  const [solutionText, setSolutionText] = useState('');
  const [solutionId, setSolutionId] = useState<number | null>(null);
  const [solutionFiles, setSolutionFiles] = useState<
    { id: number; filename: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFromSolution = (solutions: Solution[]) => {
    if (!solutions.length) return;
    const latest = solutions[0];
    const textBlock = latest.content?.find((c) => c.type === 'text');
    if (textBlock) setSolutionText(textBlock.value);
    setSolutionId(latest.id);
    if (latest.files) {
      setSolutionFiles(latest.files.map((f) => ({ id: f.id, filename: f.filepath })));
    }
  };

  const save = async (taskId: number, answer: string | null) => {
    try {
      const data = await solutionApi.save(taskId, answer, [
        { type: 'text', value: solutionText },
      ]);
      setSolutionId(data.id);
      alert('Решение сохранено!');
    } catch {
      alert('Ошибка сохранения');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !solutionId) return;
    setUploading(true);
    try {
      const data = await solutionApi.uploadFile(solutionId, e.target.files[0]);
      setSolutionFiles((prev) => [...prev, { id: data.id, filename: data.filename }]);
    } catch {
      alert('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = async (taskId: number, answer: string | null) => {
    if (!solutionId) {
      try {
        const data = await solutionApi.save(taskId, answer, [
          { type: 'text', value: solutionText },
        ]);
        setSolutionId(data.id);
        fileInputRef.current?.click();
      } catch {
        alert('Сначала сохраните решение');
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  return {
    solutionText,
    setSolutionText,
    solutionId,
    solutionFiles,
    uploading,
    fileInputRef,
    save,
    handleFileChange,
    triggerUpload,
    loadFromSolution,
  };
}
