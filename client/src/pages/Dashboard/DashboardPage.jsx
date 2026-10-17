import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FolderGit2, Users, Clock, ArrowRight, Code, Globe, FileCode } from 'lucide-react';
import { workspaceApi } from '../../services/workspaceApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: 'javascript'
  });
  const [error, setError] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceApi.list({ limit: 50 });
      setWorkspaces(data?.items || []);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const res = await workspaceApi.create(formData);
      setCreateModalOpen(false);
      navigate(`/workspaces/${res.workspace.id}`);
    } catch (err) {
      setError(err.message || 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppLayout onNewWorkspace={() => setCreateModalOpen(true)}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-main">Workspaces</h1>
            <p className="text-sm text-text-muted">Manage your collaborative projects and team code repositories</p>
          </div>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
            className="shadow-md"
          >
            Create Workspace
          </Button>
        </div>

        {/* Workspace Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-surface bg-bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="rounded-surface bg-bg-card border border-border p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-text-main">No workspaces yet</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Create your first workspace to start writing code collaboratively with your team in real time.
            </p>
            <Button variant="primary" icon={Plus} onClick={() => setCreateModalOpen(true)}>
              Create Your First Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                hover
                onClick={() => navigate(`/workspaces/${ws.id}`)}
                className="flex flex-col justify-between h-48 border-border"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-border text-text-muted">
                      {ws.role}
                    </span>
                    <div className="flex items-center space-x-1 text-xs text-text-muted">
                      <Users className="w-3.5 h-3.5" />
                      <span>{ws.memberCount}</span>
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-text-main truncate">{ws.name}</h3>
                  <p className="text-xs text-text-muted line-clamp-2 mt-1">
                    {ws.description || 'Collaborative coding project.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs text-text-muted">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ws.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <span className="inline-flex items-center text-accent font-medium hover:underline">
                    Open <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          {error && (
            <div className="p-3 rounded-surface bg-error/15 border border-error/30 text-xs text-error">
              {error}
            </div>
          )}

          <Input
            label="Workspace Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Real-Time Chat Engine"
            required
            autoFocus
          />

          <Input
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="What are you building?"
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
              Starter Template
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'javascript', label: 'Node.js', icon: Code },
                { id: 'html-css-js', label: 'HTML/CSS/JS', icon: Globe },
                { id: 'blank', label: 'Blank', icon: FileCode }
              ].map((tpl) => (
                <button
                  type="button"
                  key={tpl.id}
                  onClick={() => setFormData({ ...formData, template: tpl.id })}
                  className={`p-3 rounded-surface border text-center flex flex-col items-center space-y-1.5 transition-all ${
                    formData.template === tpl.id
                      ? 'border-accent bg-accent/10 text-accent font-semibold shadow-sm'
                      : 'border-border bg-bg-editor text-text-muted hover:text-text-main hover:border-border-hover'
                  }`}
                >
                  <tpl.icon className="w-5 h-5" />
                  <span className="text-xs">{tpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={creating}>
              Create Workspace
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
