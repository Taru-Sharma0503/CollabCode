import React, { useState } from 'react';
import * as Diff from 'diff';
import { Columns, AlignJustify } from 'lucide-react';

export default function DiffViewer({ oldCode = '', newCode = '', fileName = 'File' }) {
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'unified'

  const diffResult = Diff.diffLines(oldCode, newCode);

  return (
    <div className="flex flex-col h-full bg-bg-editor font-mono text-xs overflow-hidden border border-border rounded-surface">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-bg-card text-text-muted">
        <span className="font-semibold text-text-main">{fileName}</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('split')}
            className={`p-1 rounded flex items-center space-x-1 ${
              viewMode === 'split' ? 'bg-border text-text-main' : 'hover:text-text-main'
            }`}
            title="Side-by-side view"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="text-[10px]">Split</span>
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={`p-1 rounded flex items-center space-x-1 ${
              viewMode === 'unified' ? 'bg-border text-text-main' : 'hover:text-text-main'
            }`}
            title="Unified view"
          >
            <AlignJustify className="w-3.5 h-3.5" />
            <span className="text-[10px]">Unified</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {viewMode === 'unified' ? (
          <div className="space-y-0.5">
            {diffResult.map((part, index) => {
              const bgColor = part.added
                ? 'bg-emerald-950/40 text-emerald-300'
                : part.removed
                ? 'bg-rose-950/40 text-rose-300'
                : 'text-text-main';
              const prefix = part.added ? '+' : part.removed ? '-' : ' ';

              return (
                <div key={index} className={`px-2 py-0.5 whitespace-pre-wrap leading-relaxed rounded ${bgColor}`}>
                  {part.value.split('\n').filter(Boolean).map((line, lIdx) => (
                    <div key={lIdx} className="flex">
                      <span className="w-4 select-none opacity-50 shrink-0">{prefix}</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 h-full">
            <div className="border-r border-border pr-2 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-rose-400 mb-1 sticky top-0 bg-bg-editor">
                Original Version
              </div>
              <pre className="whitespace-pre-wrap text-text-muted">{oldCode}</pre>
            </div>
            <div className="pl-2 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 sticky top-0 bg-bg-editor">
                Target Version
              </div>
              <pre className="whitespace-pre-wrap text-text-main">{newCode}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
