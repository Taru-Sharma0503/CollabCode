import React from 'react';
import { Users, Circle } from 'lucide-react';

export default function PresencePanel({ collaborators = [], activeFile = null }) {
  return (
    <div className="h-full flex flex-col bg-bg-card p-3 select-none text-text-main">
      <div className="flex items-center space-x-2 pb-3 border-b border-border text-xs uppercase font-semibold text-text-muted">
        <Users className="w-4 h-4 text-accent" />
        <span>Collaborators ({collaborators.length})</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {collaborators.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">You are the only one here right now.</p>
        ) : (
          collaborators.map((c) => (
            <div key={c.userId} className="flex items-center justify-between p-2 rounded-surface bg-bg-main/60 border border-border/40">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-7 h-7 rounded-full bg-accent/30 border border-accent/50 flex items-center justify-center font-bold text-xs text-accent shrink-0">
                  {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium text-text-main truncate">{c.name}</p>
                  {c.activeFileId && (
                    <p className="text-[10px] text-text-muted truncate">
                      editing {c.activeFileId === activeFile?.id ? activeFile?.name : 'file'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 shrink-0">
                <Circle className={`w-2 h-2 fill-current ${c.status === 'active' ? 'text-success' : 'text-warning'}`} />
                <span className="text-[10px] text-text-muted capitalize">{c.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
