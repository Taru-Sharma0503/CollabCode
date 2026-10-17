import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, LogOut, User, Settings, Play, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export default function Navbar({
  workspace = null,
  collaborators = [],
  onRun = null,
  isExecuting = false,
  isSynced = true
}) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-14 border-b border-border bg-bg-card px-4 flex items-center justify-between select-none z-30">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="flex items-center space-x-2 text-accent hover:text-accent-hover font-bold text-lg">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-accent" />
          </div>
          <span className="tracking-tight text-text-main">Collab<span className="text-accent">Code</span></span>
        </Link>

        {workspace && (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-text-muted">/</span>
            <Link to={`/workspaces/${workspace.id}`} className="font-medium text-text-main hover:underline">
              {workspace.name}
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted capitalize">
              {workspace.role || 'member'}
            </span>
            {isSynced ? (
              <span className="flex items-center space-x-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>Synced</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                <span>Saving...</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-3">
        {onRun && (
          <Button
            variant="primary"
            size="sm"
            onClick={onRun}
            loading={isExecuting}
            icon={Play}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm"
          >
            {isExecuting ? 'Running...' : 'Run Code'}
          </Button>
        )}

        {collaborators.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {collaborators.map((c, idx) => (
              <div
                key={c.userId || idx}
                title={`${c.name} (${c.status})`}
                className="w-7 h-7 rounded-full bg-accent/80 border-2 border-bg-card flex items-center justify-center text-xs font-semibold text-white shadow"
              >
                {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
              </div>
            ))}
          </div>
        )}

        {user && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-1.5 rounded-surface hover:bg-border-hover transition-colors text-text-main text-sm"
            >
              <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center font-medium text-accent">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden md:inline font-medium">{user.name}</span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-surface bg-bg-card border border-border shadow-xl py-1 z-50 animate-fade-in"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs text-text-muted">Signed in as</p>
                  <p className="text-sm font-semibold text-text-main truncate">{user.email}</p>
                </div>
                <Link to="/profile" className="flex items-center space-x-2 px-4 py-2 text-sm text-text-muted hover:text-text-main hover:bg-border-hover">
                  <User className="w-4 h-4" />
                  <span>Your Profile</span>
                </Link>
                <Link to="/settings/account" className="flex items-center space-x-2 px-4 py-2 text-sm text-text-muted hover:text-text-main hover:bg-border-hover">
                  <Settings className="w-4 h-4" />
                  <span>Account Settings</span>
                </Link>
                <div className="border-t border-border my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-error hover:bg-error/10 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
