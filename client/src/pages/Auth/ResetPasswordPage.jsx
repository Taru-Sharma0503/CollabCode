import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Code2, Lock } from 'lucide-react';
import { authApi } from '../../services/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authApi.resetPassword({ token, password, confirmPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed or token expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-bg-card border border-border rounded-surface p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2 text-accent font-bold text-xl">
            <div className="w-9 h-9 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center">
              <Code2 className="w-5 h-5 text-accent" />
            </div>
            <span className="text-text-main">Collab<span className="text-accent">Code</span></span>
          </Link>
          <h2 className="text-xl font-bold text-text-main">Set new password</h2>
          <p className="text-xs text-text-muted">Enter and confirm your new secure password</p>
        </div>

        {success ? (
          <div className="p-4 rounded-surface bg-success/15 border border-success/30 text-xs text-success text-center">
            Password updated successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-surface bg-error/15 border border-error/30 text-xs text-error">
                {error}
              </div>
            )}

            <Input
              label="New password"
              type="password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
            />

            <Input
              label="Confirm new password"
              type="password"
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
