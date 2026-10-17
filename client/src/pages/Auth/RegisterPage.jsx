import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
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
          <h2 className="text-xl font-bold text-text-main">Create an account</h2>
          <p className="text-xs text-text-muted">Start collaborating on code in real time</p>
        </div>

        {error && (
          <div className="p-3 rounded-surface bg-error/15 border border-error/30 text-xs text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display name"
            type="text"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Taru Sharma"
            required
            autoFocus
          />

          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            required
          />

          <div className="relative">
            <Input
              label="Password (min. 8 characters)"
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

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="••••••••"
            required
          />

          <Button type="submit" variant="primary" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
