import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/authErrors';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordIssue = password ? validatePassword(password) : null;

  useEffect(() => {
    // Check if we have the recovery token in the URL hash
    const hash = window.location.hash;
    if (!hash || !hash.includes('type=recovery')) {
      setError('Invalid or expired password reset link. Please try again.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordIssue) return;

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 flex flex-col items-center">
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 relative overflow-hidden">
        {/* Decorative gradient top edge */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-violet-500 to-indigo-500" />
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
          <p className="text-gray-400 text-sm">
            Enter a new password for your Dave's FilmHub account.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg px-4 py-3 mb-6">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Password Updated</h2>
            <p className="text-gray-400 text-sm mb-6">
              Your password has been successfully changed. Redirecting to home...
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 chars, letters + numbers"
                  required
                  disabled={!!error && !error.includes('Failed')}
                  className={`w-full bg-dark-bg border text-white placeholder-gray-600 rounded-lg pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${
                    passwordIssue && password
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-dark-border focus:border-violet-500 focus:ring-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <p className={`mt-2 text-xs ${passwordIssue ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {passwordIssue || 'Password looks good!'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !!passwordIssue || !password || (!!error && !error.includes('Failed'))}
              className="w-full bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
