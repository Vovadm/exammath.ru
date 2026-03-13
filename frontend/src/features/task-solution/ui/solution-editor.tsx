'use client';

import { Button } from '@/components/ui/button';
import { API_BASE } from '@/shared/api/http';
import type { useSolutionEditor } from '../model/use-solution-editor';

type SolutionEditorProps = {
  taskId: number;
  answer: string;
  onClose: () => void;
} & Pick<
  ReturnType<typeof useSolutionEditor>,
  | 'solutionText'
  | 'setSolutionText'
  | 'solutionFiles'
  | 'uploading'
  | 'fileInputRef'
  | 'save'
  | 'handleFileChange'
  | 'triggerUpload'
>;

export function SolutionEditor({
  taskId,
  answer,
  onClose,
  solutionText,
  setSolutionText,
  solutionFiles,
  uploading,
  fileInputRef,
  save,
  handleFileChange,
  triggerUpload,
}: SolutionEditorProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <p className="text-sm font-semibold mb-2">Ваше решение:</p>
      <textarea
        className="w-full min-h-[100px] p-3 border rounded-lg text-sm resize-y"
        placeholder="Опишите ваше решение..."
        value={solutionText}
        onChange={(e) => setSolutionText(e.target.value)}
      />

      {solutionFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {solutionFiles.map((f) => (
            <img
              key={f.id}
              src={`${API_BASE}/uploads/${f.filename}`}
              alt="Файл решения"
              className="max-h-40 rounded border"
            />
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

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={() => save(taskId, answer || null)}>
          💾 Сохранить
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
    </div>
  );
}
