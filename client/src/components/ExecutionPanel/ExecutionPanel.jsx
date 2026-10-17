import React, { useState } from 'react';
import { Terminal, Square, Trash2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import Button from '../common/Button';

export default function ExecutionPanel({
  execution = null,
  outputChunks = [],
  isExecuting = false,
  onCancel,
  onClear
}) {
  const [activeTab, setActiveTab] = useState('output'); // 'output', 'stdin'
  const [stdinValue, setStdinValue] = useState('');

  const getStatusBadge = () => {
    if (!execution) return null;

    switch (execution.status) {
      case 'running':
        return (
          <span className="flex items-center space-x-1 text-xs text-accent bg-accent/15 px-2 py-0.5 rounded-full border border-accent/30 animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Running...</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center space-x-1 text-xs text-success bg-success/15 px-2 py-0.5 rounded-full border border-success/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Finished (Exit {execution.exitCode ?? 0})</span>
          </span>
        );
      case 'failed':
      case 'timed_out':
        return (
          <span className="flex items-center space-x-1 text-xs text-error bg-error/15 px-2 py-0.5 rounded-full border border-error/30">
            <AlertTriangle className="w-3 h-3" />
            <span>{execution.status === 'timed_out' ? 'Timed Out (5s limit)' : 'Failed'}</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="text-xs text-text-muted bg-border px-2 py-0.5 rounded-full">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-48 border-t border-border bg-bg-editor flex flex-col font-mono text-xs select-none">
      {/* Panel Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-bg-card text-text-muted">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-text-main font-semibold">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span>Output Console</span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'output' ? 'bg-border text-text-main font-medium' : 'hover:text-text-main'
              }`}
            >
              Console Output
            </button>
            <button
              onClick={() => setActiveTab('stdin')}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === 'stdin' ? 'bg-border text-text-main font-medium' : 'hover:text-text-main'
              }`}
            >
              Standard Input (stdin)
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusBadge()}

          {execution?.duration !== undefined && execution.duration !== null && (
            <span className="text-[11px] text-text-muted">{execution.duration}ms</span>
          )}

          {isExecuting && (
            <button
              onClick={onCancel}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-error/20 text-error hover:bg-error/30 transition-colors"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={onClear}
            title="Clear output"
            className="p-1 text-text-muted hover:text-text-main transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Output Console Display */}
      <div className="flex-1 overflow-y-auto p-3 text-text-main select-text font-mono whitespace-pre-wrap leading-relaxed">
        {activeTab === 'output' ? (
          outputChunks.length === 0 ? (
            <span className="text-text-muted italic select-none">
              Click &quot;Run Code&quot; above to execute code in the sandbox.
            </span>
          ) : (
            outputChunks.map((chunk, idx) => (
              <span
                key={idx}
                className={chunk.stream === 'stderr' ? 'text-error' : 'text-text-main'}
              >
                {chunk.text}
              </span>
            ))
          )
        ) : (
          <div className="h-full flex flex-col space-y-2">
            <p className="text-text-muted text-[11px]">
              Provide standard input lines to pass into the process during execution:
            </p>
            <textarea
              value={stdinValue}
              onChange={(e) => setStdinValue(e.target.value)}
              placeholder="e.g. 42&#10;Alice"
              className="flex-1 bg-bg-main border border-border rounded-surface p-2 text-text-main focus:outline-none focus:border-accent resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
