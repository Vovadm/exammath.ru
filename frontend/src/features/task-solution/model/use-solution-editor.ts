import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { solutionApi } from '@/entities/solution/api/solution-api';
import type { Solution } from '@/entities/solution/model/types';

interface UseSolutionEditorReturn {
  solutionText: string;
  setSolutionText: (v: string) => void;
  solutionId: number | null;
  solutionFiles: { id: number; filename: string }[];
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  showWhiteboard: boolean;
  setShowWhiteboard: (v: boolean) => void;
  save: (taskId: number, answer: string | null) => Promise<void>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerUpload: (taskId: number, answer: string | null) => Promise<void>;
  loadFromSolution: (solutions: Solution[]) => void;
  handleWhiteboardSave: (
    taskId: number,
    answer: string | null,
    blob: Blob,
  ) => Promise<void>;
  deleteSolution: () => Promise<boolean>;
}

export function useSolutionEditor(): UseSolutionEditorReturn {
  const [solutionText, setSolutionText] = useState('');
  const [solutionId, setSolutionId] = useState<number | null>(null);
  const solutionIdRef = useRef<number | null>(null);
  const [solutionFiles, setSolutionFiles] = useState<
    { id: number; filename: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateSolutionId = (id: number | null) => {
    setSolutionId(id);
    solutionIdRef.current = id;
  };

  const loadFromSolution = (solutions: Solution[]) => {
    if (!solutions.length) return;
    const latest = solutions[0];
    const textBlock = latest.content?.find((c) => c.type === 'text');
    if (textBlock) setSolutionText(textBlock.value);
    updateSolutionId(latest.id);
    if (latest.files) {
      setSolutionFiles(
        latest.files.map((f: { id: number; filepath: string }) => ({
          id: f.id,
          filename: f.filepath,
        })),
      );
    }
  };

  const save = async (taskId: number, answer: string | null) => {
    try {
      const data = await solutionApi.save(taskId, answer, [
        { type: 'text', value: solutionText },
      ]);
      updateSolutionId(data.id);
      toast.success('Решение сохранено!');
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  const uploadFileBlob = async (currentId: number, file: File | Blob) => {
    setUploading(true);
    try {
      const data = await solutionApi.uploadFile(currentId, file);
      setSolutionFiles((prev) => [...prev, { id: data.id, filename: data.filename }]);
    } catch {
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentId = solutionIdRef.current;
    if (!e.target.files?.[0] || !currentId) return;
    await uploadFileBlob(currentId, e.target.files[0]);
  };

  const triggerUpload = async (taskId: number, answer: string | null) => {
    if (!solutionId) {
      try {
        const data = await solutionApi.save(taskId, answer, [
          { type: 'text', value: solutionText },
        ]);
        updateSolutionId(data.id);
        fileInputRef.current?.click();
      } catch {
        toast.error('Сначала сохраните решение');
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleWhiteboardSave = async (
    taskId: number,
    answer: string | null,
    blob: Blob,
  ) => {
    let currentId = solutionIdRef.current;
    if (!currentId) {
      try {
        const data = await solutionApi.save(taskId, answer, [
          { type: 'text', value: solutionText },
        ]);
        updateSolutionId(data.id);
        currentId = data.id;
      } catch {
        toast.error('Сначала сохраните решение');
        return;
      }
    }
    setShowWhiteboard(false);
    await uploadFileBlob(currentId, blob);
  };

  const deleteSolution = async () => {
    if (!solutionId) return false;
    try {
      await solutionApi.delete(solutionId);
      setSolutionText('');
      setSolutionFiles([]);
      updateSolutionId(null);
      toast.success('Решение удалено');
      return true;
    } catch {
      toast.error('Ошибка при удалении');
      return false;
    }
  };

  return {
    solutionText,
    setSolutionText,
    solutionId,
    solutionFiles,
    uploading,
    fileInputRef,
    showWhiteboard,
    setShowWhiteboard,
    save,
    handleFileChange,
    triggerUpload,
    loadFromSolution,
    handleWhiteboardSave,
    deleteSolution,
  };
}
