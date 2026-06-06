import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../lib/routes';

export default function AdminGuard({ children, onSignInClick }) {
  const { user, profile, loading, isGuest, isLoggedIn, refetchProfile } = useAuth();
  const [checkingRole, setCheckingRole] = useState(true);
  const [resolvedRole, setResolvedRole] = useState(null);

  useEffect(() => {
    if (loading) return;

    if (isGuest || !isLoggedIn || !user) {
      setCheckingRole(false);
      setResolvedRole(null);
      return;
    }

    let cancelled = false;
    setCheckingRole(true);

    refetchProfile()
      .then((fresh) => {
        if (!cancelled) {
          setResolvedRole(fresh?.role ?? profile?.role ?? 'user');
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingRole(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loading, isGuest, isLoggedIn, user, refetchProfile, profile?.role]);

  if (loading || checkingRole) {
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

  const role = resolvedRole ?? profile?.role ?? 'user';

  if (role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 text-sm mb-2">
            You are signed in as <span className="text-white">{user.email}</span>, but your
            account role is <span className="text-brand-gold font-semibold">{role}</span> — not{' '}
            <span className="text-brand-gold font-semibold">admin</span>.
          </p>
          <p className="text-gray-500 text-xs mb-6">
            Run the Phase 6 SQL in Supabase to set your role to admin, then sign out and sign back
            in.
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
