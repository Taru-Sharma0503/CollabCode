import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, Mail, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../services/authApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'An error occurred.');
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
          <h2 className="text-xl font-bold text-text-main">Reset your password</h2>
          <p className="text-xs text-text-muted">Enter your account email to receive reset instructions</p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-surface bg-success/15 border border-success/30 text-xs text-success text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-success" />
            <p className="font-semibold">Reset instructions sent!</p>
            <p className="text-text-muted">If an account exists for {email}, a password reset link has been dispatched.</p>
            <div className="pt-2">
              <Link to="/login" className="text-accent underline font-semibold">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-surface bg-error/15 border border-error/30 text-xs text-error">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />

            <Button type="submit" variant="primary" loading={loading} className="w-full">
              Send Reset Link
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-xs text-accent hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
