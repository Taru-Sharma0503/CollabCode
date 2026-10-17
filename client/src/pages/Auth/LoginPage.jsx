import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
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
          <h2 className="text-xl font-bold text-text-main">Welcome back</h2>
          <p className="text-xs text-text-muted">Sign in to your account to continue collaborating</p>
        </div>

        {error && (
          <div className="p-3 rounded-surface bg-error/15 border border-error/30 text-xs text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            required
            autoFocus
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-text-muted hover:text-text-main"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <Link to="/forgot-password" className="text-accent hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-accent font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
