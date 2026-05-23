import { useState } from 'react'
import { X, Mail, Lock, User, Film, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { validatePassword } from '../../lib/authErrors.js'

const SIGNUP_SUCCESS_MSG =
  'Account created. Please check your email and confirm your account before signing in.'

export default function AuthModal({ isOpen, onClose }) {
  const { signIn, signUp, continueAsGuest, resendConfirmationEmail } = useAuth()

  const [mode, setMode] = useState('signin')
  const [showPassword, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showResend, setShowResend] = useState(false)

  const [form, setForm] = useState({ email: '', password: '', username: '' })

  const passwordIssue =
    mode === 'signup' && form.password ? validatePassword(form.password) : null

  if (!isOpen) return null

  function updateField(e) {
    setError('')
    setSuccess('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleResend() {
    setResendLoading(true)
    setError('')
    const { error: err } = await resendConfirmationEmail(form.email)
    if (err) {
      setError(err.message)
    } else {
      setSuccess('Confirmation email sent. Check your inbox or spam folder.')
      setShowResend(false)
    }
    setResendLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setShowResend(false)
    setLoading(true)

    if (mode === 'signin') {
      const { error: err } = await signIn({ email: form.email, password: form.password })
      if (err) {
        setError(err.message)
        if (err.code === 'email_not_confirmed' || err.message?.includes('confirm your email')) {
          setShowResend(true)
        }
      } else {
        onClose()
      }
    } else {
      if (!form.username.trim()) {
        setError('Username is required.')
        setLoading(false)
        return
      }

      const pwError = validatePassword(form.password)
      if (pwError) {
        setError(pwError)
        setLoading(false)
        return
      }

      const result = await signUp({
        email: form.email,
        password: form.password,
        username: form.username.trim(),
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        setSuccess(SIGNUP_SUCCESS_MSG)
        setShowResend(true)
        setMode('signin')
        setForm((f) => ({ ...f, password: '', username: '' }))
      }
    }

    setLoading(false)
  }

  function handleGuest() {
    continueAsGuest()
    onClose()
  }

  function switchMode() {
    setError('')
    setSuccess('')
    setShowResend(false)
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-rose-600 via-violet-600 to-indigo-600" />

        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <Film className="text-rose-500" size={20} />
            <span className="text-white font-bold text-lg tracking-tight">Dave&apos;s FilmHub</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <h2 className="text-white text-2xl font-bold mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-white/40 text-sm mb-6">
            {mode === 'signin'
              ? 'Sign in to sync your watchlist and reviews.'
              : 'Join to track films and share your reviews.'}
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-lg px-4 py-3 mb-4">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-lg px-4 py-3 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={updateField}
                    placeholder="cinephile42"
                    required
                    autoComplete="username"
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-lg pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={updateField}
                  placeholder={mode === 'signup' ? 'Min. 8 chars, letters + numbers' : '••••••••'}
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={`w-full bg-white/5 border text-white placeholder-white/20 rounded-lg pl-9 pr-10 py-3 text-sm focus:outline-none focus:ring-1 transition-all ${
                    passwordIssue
                      ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500'
                      : 'border-white/10 focus:border-violet-500 focus:ring-violet-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'signup' && (
                <p
                  className={`mt-1.5 text-xs ${
                    passwordIssue ? 'text-rose-400' : 'text-white/30'
                  }`}
                >
                  {passwordIssue ?? 'At least 8 characters with one letter and one number.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg py-3 text-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {(showResend || (mode === 'signin' && success)) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || !form.email.trim()}
                className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors disabled:opacity-50"
              >
                {resendLoading ? 'Sending…' : 'Resend confirmation email'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/20 text-xs">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGuest}
            className="w-full border border-white/10 hover:border-white/20 text-white/60 hover:text-white rounded-lg py-3 text-sm font-medium transition-all"
          >
            Continue as Guest
          </button>

          <p className="text-center text-white/30 text-sm mt-5">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={switchMode}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
