import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import LandingPage from '../pages/Landing/LandingPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import ForgotPasswordPage from '../pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/Auth/ResetPasswordPage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import WorkspaceOverviewPage from '../pages/WorkspaceOverview/WorkspaceOverviewPage';
import WorkspaceEditorPage from '../pages/WorkspaceEditor/WorkspaceEditorPage';
import RevisionHistoryPage from '../pages/RevisionHistory/RevisionHistoryPage';
import WorkspaceSettingsPage from '../pages/WorkspaceSettings/WorkspaceSettingsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import AccountSettingsPage from '../pages/AccountSettings/AccountSettingsPage';
import AcceptInvitationPage from '../pages/WorkspaceOverview/AcceptInvitationPage';
import NotFoundPage from '../pages/NotFoundPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-muted text-sm">
        Authenticating...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  // Public Landing
  {
    path: '/',
    element: <LandingPage />
  },

  // Public Auth
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    )
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    )
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/reset-password/:token',
    element: <ResetPasswordPage />
  },

  // Protected Routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/new',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/:workspaceId',
    element: (
      <ProtectedRoute>
        <WorkspaceOverviewPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/:workspaceId/editor',
    element: (
      <ProtectedRoute>
        <WorkspaceEditorPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/:workspaceId/history',
    element: (
      <ProtectedRoute>
        <RevisionHistoryPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/:workspaceId/history/:revisionId',
    element: (
      <ProtectedRoute>
        <RevisionHistoryPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/workspaces/:workspaceId/settings',
    element: (
      <ProtectedRoute>
        <WorkspaceSettingsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/settings/account',
    element: (
      <ProtectedRoute>
        <AccountSettingsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/invitations/:token/accept',
    element: (
      <ProtectedRoute>
        <AcceptInvitationPage />
      </ProtectedRoute>
    )
  },

  // 404
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
