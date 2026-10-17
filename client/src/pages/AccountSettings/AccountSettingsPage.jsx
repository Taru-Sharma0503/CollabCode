import React, { useState, useEffect } from 'react';
import { Settings, Shield, Laptop, Trash2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/authApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function AccountSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await authApi.getSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      console.warn('Failed to load sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updatePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      await authApi.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err) {
      alert(err.message || 'Failed to revoke session.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center space-x-2">
            <Settings className="w-5 h-5 text-accent" />
            <span>Account Security & Sessions</span>
          </h1>
          <p className="text-xs text-text-muted">Manage your password credentials and active browser sessions</p>
        </div>

        {/* Change Password Card */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-text-main border-b border-border pb-2 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-accent" />
            <span>Change Password</span>
          </h2>

          {passwordSuccess && (
            <div className="p-3 bg-success/15 border border-success/30 rounded-surface text-xs text-success flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Password updated successfully!</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-error/15 border border-error/30 rounded-surface text-xs text-error">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="New Password (min 8 chars)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" loading={savingPassword}>
              Update Password
            </Button>
          </form>
        </Card>

        {/* Active Sessions Card */}
        <Card className="space-y-4">
          <h2 className="text-base font-semibold text-text-main border-b border-border pb-2 flex items-center space-x-2">
            <Laptop className="w-4 h-4 text-accent" />
            <span>Active Browser Sessions</span>
          </h2>

          {loadingSessions ? (
            <p className="text-xs text-text-muted">Loading active sessions...</p>
          ) : sessions.length === 0 ? (
            <p className="text-xs text-text-muted">No active sessions found.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {sessions.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-text-main">{s.deviceInfo || 'Web Browser'}</p>
                    <p className="text-text-muted">
                      Last active: {new Date(s.lastActiveAt).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRevokeSession(s.id)}
                    icon={Trash2}
                    className="text-error hover:bg-error/10"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
