import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import {
  mapAuthError,
  getAuthRedirectUrl,
} from '../lib/authErrors.js'

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

async function clearUnconfirmedSession() {
  // Email confirmation is disabled, so we do not clear sessions anymore.
  return
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  // ── Fetch profile row ───────────────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!supabase) return

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) setProfile(data)
  }, [])

  const applySession = useCallback(
    async (session) => {
      if (!session?.user) {
        setUser(null)
        setProfile(null)
        return
      }

      setUser(session.user)
      setIsGuest(false)
      fetchProfile(session.user.id)
    },
    [fetchProfile],
  )

  // ── Bootstrap: restore session on mount ────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsGuest(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await applySession(session)
      },
    )

    return () => subscription.unsubscribe()
  }, [applySession])

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  const signUp = useCallback(async ({ email, password, username }) => {
    if (!supabase) {
      return {
        error: {
          message: mapAuthError({ message: 'Supabase not configured' }),
        },
      }
    }

    const trimmedEmail = email.trim()
    const trimmedUsername = username?.trim()
    const redirectTo = getAuthRedirectUrl()

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username: trimmedUsername,
        },
      },
    })

    if (error) {
      return {
        error: {
          message: mapAuthError(error),
          raw: error,
        },
      }
    }

    return {
      data,
      needsEmailConfirmation: false,
      email: trimmedEmail,
    }
  }, [])

  // ── Sign In ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return {
        error: {
          message: mapAuthError({ message: 'Supabase not configured' }),
        },
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      return {
        data,
        error: {
          message: mapAuthError(error),
          raw: error,
        },
      }
    }

    return { data, error: null }
  }, [])

  // ── Sign In with Google ─────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    if (!supabase) {
      return {
        error: {
          message: mapAuthError({ message: 'Supabase not configured' }),
        },
      }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    })

    if (error) {
      return {
        data,
        error: {
          message: mapAuthError(error),
          raw: error,
        },
      }
    }

    return { data, error: null }
  }, [])

  // ── Resend confirmation email ───────────────────────────────────────────────
  const resendConfirmationEmail = useCallback(async (email) => {
    if (!supabase) {
      return {
        error: {
          message: mapAuthError({ message: 'Supabase not configured' }),
        },
      }
    }

    const trimmedEmail = email?.trim()

    if (!trimmedEmail) {
      return {
        error: {
          message: 'Enter your email address first.',
        },
      }
    }
 const { error } = await supabase.auth.resend({
      type: 'signup',
      email: trimmedEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    })

    if (error) {
      return {
        error: {
          message: mapAuthError(error),
          raw: error,
        },
      }
    }

    return { success: true }
  }, [])

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    sessionStorage.removeItem('filmhub_guest_session')
    localStorage.removeItem('filmhub_intro_seen')

    if (!supabase) {
      setIsGuest(false)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setIsGuest(false)
  }, [])

  // ── Continue as Guest ───────────────────────────────────────────────────────
  const continueAsGuest = useCallback(() => {
    setIsGuest(true)
    setUser(null)
    setProfile(null)
    sessionStorage.setItem('filmhub_guest_session', 'true')
  }, [])

  // ── Update Profile ──────────────────────────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!supabase || !user) {
      return {
        error: {
          message: 'Not authenticated',
        },
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) setProfile(data)

    if (error) {
      return {
        data,
        error: {
          message: 'Could not update your profile. Please try again.',
          raw: error,
        },
      }
    }

    return { data, error }
  }, [user])

  const resetPasswordForEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending reset email:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    try {
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user auth:', error);
      throw error;
    }
  };

  // ── Context value ───────────────────────────────────────────────────────────
  const value = {
    user,
    profile,
    loading,
    isGuest,
    isLoggedIn: Boolean(user),
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    continueAsGuest,
    updateProfile,
    resendConfirmationEmail,
    refetchProfile: () => user && fetchProfile(user.id),
    clearUnconfirmedSession,
    resetPasswordForEmail,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}