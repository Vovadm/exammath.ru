'use client';

import '@excalidraw/excalidraw/index.css';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';
import { useState, useEffect } from 'react';
import type React from 'react';
import { Button } from '@/components/ui/button';

type ExcalidrawAPI = Parameters<
  Exclude<React.ComponentProps<typeof Excalidraw>['excalidrawAPI'], undefined>
>[0];

export interface WhiteboardModalProps {
  onClose: () => void;
  onSave: (blob: Blob) => void;
}

export function WhiteboardModal({ onClose, onSave }: WhiteboardModalProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = async () => {
    if (!excalidrawAPI) return;
    setIsExporting(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      if (!elements || !elements.length) {
        onClose();
        return;
      }
      const appState = excalidrawAPI.getAppState();
      const blob = await exportToBlob({
        elements,
        mimeType: 'image/png',
        appState: { ...appState, exportWithDarkMode: false },
        files: excalidrawAPI.getFiles(),
      });
      onSave(blob);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-3 border-b shrink-0">
          <h3 className="font-semibold text-sm text-indigo-900">Доска для рисования</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isExporting}
            >
              Отмена
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isExporting}>
              {isExporting ? 'Сохранение...' : 'Прикрепить как картинку'}
            </Button>
          </div>
        </div>
        <div className="relative w-full flex-1">
          <div className="absolute inset-0">
            <Excalidraw
              excalidrawAPI={(api) => setExcalidrawAPI(api)}
              theme="light"
              UIOptions={{
                canvasActions: {
                  loadScene: false,
                  export: false,
                  saveToActiveFile: false,
                  toggleTheme: false,
                  saveAsImage: false,
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
