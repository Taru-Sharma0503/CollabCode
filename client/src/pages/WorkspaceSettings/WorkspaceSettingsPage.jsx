import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Settings, ArrowLeft, Trash2, Shield, UserX } from 'lucide-react';
import { workspaceApi } from '../../services/workspaceApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function WorkspaceSettingsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [wsData, membersData] = await Promise.all([
          workspaceApi.getById(workspaceId),
          workspaceApi.getMembers(workspaceId)
        ]);

        setWorkspace(wsData.workspace);
        setName(wsData.workspace.name);
        setDescription(wsData.workspace.description || '');
        setMembers(membersData.members || []);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }

    loadData();
  }, [workspaceId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await workspaceApi.update(workspaceId, { name, description });
      alert('Workspace updated successfully.');
    } catch (err) {
      alert(err.message || 'Failed to update workspace.');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await workspaceApi.updateMemberRole(workspaceId, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this collaborator from the workspace?')) return;

    try {
      await workspaceApi.removeMember(workspaceId, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirmation = prompt(`To delete this workspace permanently, type "${workspace?.name}":`);
    if (confirmation !== workspace?.name) {
      alert('Workspace name does not match. Deletion aborted.');
      return;
    }

    setDeleting(true);
    try {
      await workspaceApi.delete(workspaceId);
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to delete workspace.');
    } finally {
      setDeleting(false);
    }
  };

  if (!workspace) return null;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center space-x-3">
          <Link to={`/workspaces/${workspaceId}`}>
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Back to Overview
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-text-main flex items-center space-x-2">
            <Settings className="w-5 h-5 text-accent" />
            <span>Workspace Settings</span>
          </h1>
        </div>

        {/* General Settings */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-text-main border-b border-border pb-2">
            General Information
          </h2>
          <form onSubmit={handleUpdate} className="space-y-4 max-w-lg">
            <Input
              label="Workspace Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" variant="primary" loading={saving}>
              Save Changes
            </Button>
          </form>
        </Card>

        {/* Member Management */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-text-main border-b border-border pb-2 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-accent" />
            <span>Manage Members & Roles</span>
          </h2>
          <div className="divide-y divide-border/60">
            {members.map((m) => (
              <div key={m.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-main">{m.user?.name}</p>
                  <p className="text-xs text-text-muted">{m.user?.email}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {m.role === 'owner' ? (
                    <span className="text-xs px-2.5 py-1 rounded bg-border text-accent font-semibold uppercase">
                      Owner
                    </span>
                  ) : (
                    <>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                        className="rounded bg-bg-editor border border-border px-2.5 py-1 text-xs text-text-main focus:outline-none focus:border-accent"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m.userId)}
                        className="p-1 text-text-muted hover:text-error"
                        title="Remove member"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        {workspace.role === 'owner' && (
          <Card className="border-error/40 bg-error/5 space-y-4">
            <div className="border-b border-error/20 pb-2">
              <h2 className="text-base font-semibold text-error">Danger Zone</h2>
              <p className="text-xs text-text-muted">Destructive actions cannot be undone.</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-main">Delete this workspace</p>
                <p className="text-xs text-text-muted">
                  Permanently delete this workspace, files, revisions, comments, and executions.
                </p>
              </div>
              <Button
                variant="danger"
                onClick={handleDeleteWorkspace}
                loading={deleting}
                icon={Trash2}
              >
                Delete Workspace
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
