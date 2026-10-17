import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-bg-card border border-border rounded-surface p-8 space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center mx-auto text-accent">
          <FileQuestion className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-text-main">Page Not Found</h1>
        <p className="text-xs text-text-muted leading-relaxed">
          The page or workspace route you are looking for does not exist or has been removed.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
