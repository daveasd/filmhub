import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../lib/routes';

export default function AdminGuard({ children, onSignInClick }) {
  const { user, profile, loading, isGuest, isLoggedIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-gold" />
        <p className="text-sm">Verifying admin access…</p>
      </div>
    );
  }

  if (isGuest || !isLoggedIn || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <LogIn className="w-14 h-14 text-brand-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-gray-400 text-sm mb-6">
            The admin dashboard is only available to signed-in administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onSignInClick}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold text-black font-bold px-6 py-3 hover:opacity-90 min-h-[44px]"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <Link
              to={ROUTES.home}
              className="inline-flex items-center justify-center rounded-lg border border-dark-border text-gray-300 px-6 py-3 hover:text-white hover:border-gray-500 min-h-[44px]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-6">
            You do not have permission to view the admin dashboard. Contact an administrator if
            you believe this is an error.
          </p>
          <Link
            to={ROUTES.home}
            className="inline-flex items-center justify-center rounded-lg bg-dark-card border border-dark-border text-white px-6 py-3 hover:border-brand-gold/50 min-h-[44px]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
