import { useMemo } from 'react';
import Image from 'next/image';
import DOMPurify from 'isomorphic-dompurify';
import { CardContent } from '@/components/ui/card';
import { SolutionEditor } from '@/features/task-solution/ui/solution-editor';
import { StudentSolutionsList } from '@/features/student-solutions/ui/student-solutions-list';
import type { Task } from '@/entities/task/model/types';
import { formatMath } from '@/lib/math-format';
import type { useSolutionEditor } from '@/features/task-solution/model/use-solution-editor';

const TABLE_HTML_CACHE_MAX_SIZE = 100;
const tableHtmlCache = new Map<string, string>();

function getSanitizedTableHtml(t: string): string {
  const cached = tableHtmlCache.get(t);
  if (cached) return cached;

  const proxyUrl = (text: string) => {
    if (!text) return text;
    return text.replace(/https:\/\/ege\.fipi\.ru/g, '/fipi-proxy');
  };

  const sanitized = DOMPurify.sanitize(
    proxyUrl(t)
      .replace('<table>', '<table class="w-full border-collapse text-sm">')
      .replace(/<td/g, '<td class="border border-gray-300 px-3 py-2 text-center"')
      .replace(
        /<th/g,
        '<th class="border border-gray-300 px-3 py-2 text-center bg-indigo-50 font-semibold text-indigo-900"',
      ),
  );

  if (tableHtmlCache.size >= TABLE_HTML_CACHE_MAX_SIZE) {
    const firstKey = tableHtmlCache.keys().next().value as string | undefined;
    if (firstKey !== undefined) {
      tableHtmlCache.delete(firstKey);
    }
  }

  tableHtmlCache.set(t, sanitized);
  return sanitized;
}

interface TaskCardBodyProps {
  task: Task;
  showSolution: boolean;
  setShowSolution: (v: boolean) => void;
  initialAnswer: string;
  isTeacherOrAdmin: boolean;
  editor: ReturnType<typeof useSolutionEditor>;
}

export function TaskCardBody({
  task,
  showSolution,
  setShowSolution,
  initialAnswer,
  isTeacherOrAdmin,
  editor,
}: TaskCardBodyProps) {
  const proxyUrl = (text: string) => {
    if (!text) return text;
    return text.replace(/https:\/\/ege\.fipi\.ru/g, '/fipi-proxy');
  };

  const processText = (text: string) => {
    let processed = formatMath(text);
    processed = processed.replace(
      /\[IMG:([^\]]+)\]/g,
      '<img src="$1" class="inline-block align-middle mx-1" style="max-height: 4em; object-fit: contain;" alt="inline" />',
    );
    return proxyUrl(processed);
  };

  const sanitizedText = useMemo(
    () => DOMPurify.sanitize(processText(task.text)),
    [task.text],
  );
  const sanitizedTables = useMemo(
    () => task.tables?.map((t) => getSanitizedTableHtml(t)),
    [task.tables],
  );

  return (
    <CardContent className="p-5">
      <div
        className="text-sm leading-8 text-gray-800"
        dangerouslySetInnerHTML={{ __html: sanitizedText }}
      />

      {sanitizedTables?.map((html, i) => (
        <div
          key={i}
          className="my-4 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}

      {task.images?.map((url, i) => (
        <div key={i} className="mt-4 relative w-full h-96">
          <Image
            src={proxyUrl(url)}
            alt="Задание"
            fill
            className="rounded-lg border object-contain"
          />
        </div>
      ))}

      {showSolution && (
        <SolutionEditor
          taskId={task.id}
          answer={initialAnswer}
          onClose={() => setShowSolution(false)}
          solutionText={editor.solutionText}
          setSolutionText={editor.setSolutionText}
          solutionId={editor.solutionId}
          solutionFiles={editor.solutionFiles}
          uploading={editor.uploading}
          fileInputRef={editor.fileInputRef}
          showWhiteboard={editor.showWhiteboard}
          setShowWhiteboard={editor.setShowWhiteboard}
          save={editor.save}
          handleFileChange={editor.handleFileChange}
          triggerUpload={editor.triggerUpload}
          handleWhiteboardSave={editor.handleWhiteboardSave}
          deleteSolution={editor.deleteSolution}
        />
      )}

      {isTeacherOrAdmin && <StudentSolutionsList taskId={task.id} />}
    </CardContent>
  );
}
