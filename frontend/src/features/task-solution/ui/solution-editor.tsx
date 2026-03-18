'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { API_BASE } from '@/shared/api/http';
import { PenTool, Trash2 } from 'lucide-react';
import type { useSolutionEditor } from '../model/use-solution-editor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const WhiteboardModal = dynamic(
  () => import('./whiteboard-modal').then((mod) => mod.WhiteboardModal),
  { ssr: false },
);

type SolutionEditorProps = {
  taskId: number;
  answer: string;
  onClose: () => void;
  onDelete?: () => void;
} & Pick<
  ReturnType<typeof useSolutionEditor>,
  | 'solutionText'
  | 'setSolutionText'
  | 'solutionId'
  | 'solutionFiles'
  | 'uploading'
  | 'fileInputRef'
  | 'showWhiteboard'
  | 'setShowWhiteboard'
  | 'save'
  | 'handleFileChange'
  | 'triggerUpload'
  | 'handleWhiteboardSave'
  | 'deleteSolution'
>;

export function SolutionEditor({
  taskId,
  answer,
  onClose,
  onDelete,
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
  handleWhiteboardSave,
  deleteSolution,
}: SolutionEditorProps) {
  const handleDelete = async () => {
    const success = await deleteSolution();
    if (success) {
      if (onDelete) onDelete();
      onClose();
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold">Ваше решение:</p>
        {solutionId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить решение?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Ваше решение и все прикрепленные файлы
                  будут удалены.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      <textarea
        className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-y"
        placeholder="Опишите ваше решение..."
        value={solutionText}
        onChange={(e) => setSolutionText(e.target.value)}
      />
      {solutionFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {solutionFiles.map((f) => (
            <a
              key={f.id}
              href={`${API_BASE}/uploads/${f.filename}`}
              target="_blank"
              rel="noreferrer"
              className="relative w-40 h-40 block cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image
                src={`${API_BASE}/uploads/${f.filename}`}
                alt="Файл решения"
                fill
                className="rounded border object-contain"
              />
            </a>
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" onClick={() => save(taskId, answer || null)}>
          💾 Сохранить
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowWhiteboard(true)}
          disabled={uploading}
        >
          <PenTool className="mr-2 h-4 w-4" /> Нарисовать
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => triggerUpload(taskId, answer || null)}
          disabled={uploading}
        >
          {uploading ? 'Загрузка...' : '📷 Добавить картинку'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Закрыть
        </Button>
      </div>
      {showWhiteboard && (
        <WhiteboardModal
          onClose={() => setShowWhiteboard(false)}
          onSave={(blob) => handleWhiteboardSave(taskId, answer || null, blob)}
        />
      )}
    </div>
  );
}
