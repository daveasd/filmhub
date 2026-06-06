import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export default function AuthPage({ onLoginSuccess, onContinueAsGuest }) {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password || (isSignup && !email)) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    try {
      if (isSignup) {
        // Supabase sign up
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (signupError) throw signupError;
        // Auto sign in after sign up
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        onLoginSuccess({ id: signInData.user.id, username, email, isGuest: false });
      } else {
        // Supabase sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Fallback to mock admin account for convenience
          if (username.toLowerCase() === 'admin' && password === 'admin') {
            onLoginSuccess({ username: 'Admin', email: 'admin@filmhub.com', isGuest: false });
            return;
          }
          throw signInError;
        }
        // Retrieve username from user metadata if stored
        const user = data.user;
        const fetchedUsername = user?.user_metadata?.username || username;
        onLoginSuccess({ id: user.id, username: fetchedUsername, email, isGuest: false });
      }
    } catch (err) {
      console.error(err);
      setError(err.message ?? 'Authentication failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[#050508]">
      {/* Background Cinematic Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center brightness-[0.15]" 
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1600')` }}
      />
      
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-brand-red/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-brand-red shadow-xl shadow-brand-red/20 mb-3">
            <Film className="h-7 w-7 text-black font-bold animate-pulse" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-wide">
            Dave&apos;s <span className="text-brand-gold">FilmHub</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Discover, track, and review your favorite cinema</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glassmorphism rounded-2xl p-8 shadow-2xl border border-white/5 bg-dark-card/80">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            {isSignup ? <UserPlus className="h-5 w-5 text-brand-gold" /> : <LogIn className="h-5 w-5 text-brand-gold" />}
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h3>

          {error && (
            <div className="mb-4 rounded-lg bg-brand-red/10 border border-brand-red/30 p-3 text-xs text-brand-red font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. movie_lover"
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                />
              </div>
            </div>

            {/* Email Input (Sign up only) */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-gold to-brand-gold/90 hover:from-brand-gold hover:to-brand-gold text-black py-3 font-bold transition-all duration-200 shadow-lg shadow-brand-gold/20"
            >
              {isSignup ? 'Sign Up' : 'Sign In'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center text-xs text-gray-400">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-brand-gold font-bold hover:underline"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-dark-card px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Guest Continue Button */}
          <button
            onClick={onContinueAsGuest}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dark-border bg-transparent hover:border-gray-500 hover:bg-dark-hover text-white py-2.5 text-sm font-semibold transition-all duration-200"
          >
            Continue as Guest
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
