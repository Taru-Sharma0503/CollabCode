import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workspaceApi } from '../../services/workspaceApi';
import Button from '../../components/common/Button';

export default function AcceptInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function accept() {
      try {
        const res = await workspaceApi.acceptInvitation(token);
        if (res?.workspace?.id) {
          navigate(`/workspaces/${res.workspace.id}`);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        setError(err.message || 'Failed to accept invitation or link expired.');
      } finally {
        setLoading(false);
      }
    }

    accept();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-bg-card border border-border rounded-surface p-8 space-y-4">
        {loading ? (
          <p className="text-sm text-text-muted">Joining workspace...</p>
        ) : error ? (
          <div className="space-y-4">
            <p className="text-sm text-error font-medium">{error}</p>
            <Link to="/dashboard">
              <Button variant="secondary">Go to Dashboard</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-success font-medium">Successfully joined workspace!</p>
        )}
      </div>
    </div>
  );
}
