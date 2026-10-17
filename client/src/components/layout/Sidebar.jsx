import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderGit2, User, Settings, PlusCircle } from 'lucide-react';

export default function Sidebar({ onNewWorkspace }) {
  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Profile', to: '/profile', icon: User },
    { label: 'Settings', to: '/settings/account', icon: Settings }
  ];

  return (
    <aside className="w-60 border-r border-border bg-bg-card flex flex-col justify-between p-3 select-none">
      <div className="space-y-4">
        {onNewWorkspace && (
          <button
            onClick={onNewWorkspace}
            className="w-full flex items-center justify-center space-x-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium py-2 px-3 rounded-surface transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Workspace</span>
          </button>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-surface text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text-muted hover:text-text-main hover:bg-border-hover/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-bg-main/50 rounded-surface border border-border/60 text-xs text-text-muted">
        <p className="font-semibold text-text-main mb-1">CollabCode Pro</p>
        <p>Real-time Yjs CRDT collaboration & sandboxed execution engine.</p>
      </div>
    </aside>
  );
}
