import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Play, Settings, History, Users, Mail, UserPlus, Clock, ArrowRight, Shield } from 'lucide-react';
import { workspaceApi } from '../../services/workspaceApi';
import { revisionApi } from '../../services/revisionApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

export default function WorkspaceOverviewPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const fetchDetails = async () => {
    try {
      const [wsData, membersData, revsData] = await Promise.all([
        workspaceApi.getById(workspaceId),
        workspaceApi.getMembers(workspaceId),
        revisionApi.list(workspaceId, { limit: 5 })
      ]);

      setWorkspace(wsData.workspace);
      setMembers(membersData.members || []);
      setRevisions(revsData.items || []);
    } catch (err) {
      console.error('Failed to load workspace overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setInviteResult(null);

    try {
      const res = await workspaceApi.inviteMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole
      });

      setInviteResult({
        token: res.invitation.token,
        inviteUrl: `${window.location.origin}/invitations/${res.invitation.token}/accept`
      });
      setInviteEmail('');
    } catch (err) {
      alert(err.message || 'Failed to send invite.');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto py-12 text-center text-text-muted">
          Loading workspace details...
        </div>
      </AppLayout>
    );
  }

  if (!workspace) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <p className="text-error font-medium">Workspace not found or unauthorized.</p>
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isOwnerOrAdmin = workspace.role === 'owner' || workspace.role === 'admin';

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Workspace Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-surface bg-bg-card border border-border">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-text-main">{workspace.name}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-border text-text-muted capitalize">
                {workspace.role}
              </span>
            </div>
            <p className="text-sm text-text-muted">{workspace.description || 'Collaborative coding workspace.'}</p>
          </div>

          <div className="flex items-center space-x-3">
            {isOwnerOrAdmin && (
              <Link to={`/workspaces/${workspaceId}/settings`}>
                <Button variant="secondary" icon={Settings}>
                  Settings
                </Button>
              </Link>
            )}
            <Link to={`/workspaces/${workspaceId}/editor`}>
              <Button variant="primary" icon={Play} className="px-5 shadow-lg shadow-accent/20">
                Open Editor
              </Button>
            </Link>
          </div>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Members Panel */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-main flex items-center space-x-2">
                <Users className="w-4 h-4 text-accent" />
                <span>Team Members ({members.length})</span>
              </h2>
              {isOwnerOrAdmin && (
                <Button
                  size="sm"
                  variant="secondary"
                  icon={UserPlus}
                  onClick={() => setInviteModalOpen(true)}
                >
                  Invite Member
                </Button>
              )}
            </div>

            <Card className="divide-y divide-border/60 p-0 overflow-hidden">
              {members.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-bg-editor/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-xs text-accent">
                      {m.user?.name ? m.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-main">{m.user?.name || 'Collaborator'}</p>
                      <p className="text-xs text-text-muted">{m.user?.email}</p>
                    </div>
                  </div>

                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-border text-text-muted capitalize">
                    {m.role}
                  </span>
                </div>
              ))}
            </Card>
          </div>

          {/* Quick Stats and Revisions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-main flex items-center space-x-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Recent Revisions</span>
              </h2>
              <Link to={`/workspaces/${workspaceId}/history`} className="text-xs text-accent hover:underline">
                View all
              </Link>
            </div>

            <Card className="space-y-3">
              {revisions.length === 0 ? (
                <p className="text-xs text-text-muted py-2">No snapshot revisions recorded yet.</p>
              ) : (
                revisions.map((rev) => (
                  <div key={rev.id} className="border-b border-border/60 pb-2.5 last:border-0 last:pb-0 space-y-1">
                    <p className="text-xs font-medium text-text-main line-clamp-1">{rev.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span>{rev.createdBy?.name || 'Author'}</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteResult(null);
        }}
        title="Invite Member to Workspace"
      >
        {inviteResult ? (
          <div className="space-y-4">
            <div className="p-3 bg-success/15 border border-success/30 rounded-surface text-xs text-success">
              Invitation link generated! Share this link with the collaborator:
            </div>
            <div className="p-2 bg-bg-main border border-border rounded-surface text-xs font-mono break-all select-all">
              {inviteResult.inviteUrl}
            </div>
            <div className="flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  navigator.clipboard.writeText(inviteResult.inviteUrl);
                  alert('Copied to clipboard!');
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="collaborator@example.com"
              required
              autoFocus
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-surface bg-bg-editor border border-border px-3 py-2 text-sm text-text-main focus:outline-none focus:border-accent"
              >
                <option value="member">Member (Can edit and collaborate)</option>
                <option value="admin">Admin (Can manage files and members)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={inviting}>
                Generate Invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </AppLayout>
  );
}
