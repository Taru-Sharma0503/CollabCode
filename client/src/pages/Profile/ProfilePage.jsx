import React, { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await authApi.updateProfile({ name, avatarUrl: avatarUrl || null });
      await refreshUser();
      setSuccess(true);
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-text-main flex items-center space-x-2">
            <User className="w-5 h-5 text-accent" />
            <span>User Profile</span>
          </h1>
          <p className="text-xs text-text-muted">Manage your personal details and collaborator display identity</p>
        </div>

        <Card className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center font-bold text-2xl text-accent">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p className="text-base font-semibold text-text-main">{user?.name}</p>
              <p className="text-xs text-text-muted">{user?.email}</p>
            </div>
          </div>

          {success && (
            <div className="p-3 bg-success/15 border border-success/30 rounded-surface text-xs text-success flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Display Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Avatar Image URL (Optional)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
            />

            <Button type="submit" variant="primary" loading={saving}>
              Save Profile
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}
