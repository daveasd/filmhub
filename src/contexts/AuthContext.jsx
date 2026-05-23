import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { mapAuthError } from '../lib/authErrors.js'

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // Supabase auth user object
  const [profile, setProfile] = useState(null)   // row from `profiles` table
  const [loading, setLoading] = useState(true)   // initial session check
  const [isGuest, setIsGuest] = useState(false)  // guest mode flag

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

  // ── Bootstrap: restore session on mount ────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) {
      // No Supabase → default to guest mode
      setIsGuest(true)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          setIsGuest(false)
          fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // ── Sign Up ─────────────────────────────────────────────────────────────────
  const signUp = useCallback(async ({ email, password, username }) => {
    if (!supabase) {
      return { error: { message: mapAuthError({ message: 'Supabase not configured' }) } }
    }

    const trimmedUsername = username?.trim()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: trimmedUsername,
        },
      },
    })

    if (error) {
      return { error: { message: mapAuthError(error), raw: error } }
    }

    return { data }
  }, [])

  // ── Sign In ─────────────────────────────────────────────────────────────────
  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) {
      return { error: { message: mapAuthError({ message: 'Supabase not configured' }) } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) {
      return { data, error: { message: mapAuthError(error), raw: error } }
    }
    return { data, error: null }
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
    if (!supabase || !user) return { error: { message: 'Not authenticated' } }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (!error && data) setProfile(data)
    return { data, error }
  }, [user])

  // ── Context value ───────────────────────────────────────────────────────────
  const value = {
    user,          // Supabase auth user (null if guest or logged out)
    profile,       // DB profile row
    loading,       // true during initial session hydration
    isGuest,       // true when browsing without an account
    isLoggedIn: Boolean(user),
    signUp,
    signIn,
    signOut,
    continueAsGuest,
    updateProfile,
    refetchProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
