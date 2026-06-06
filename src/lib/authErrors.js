/*
 * Maps Supabase auth errors to user-friendly messages.
 */
export function mapAuthError(error) {
  if (!error) return null

  const msg = String(error.message ?? error.error_description ?? '').toLowerCase()
  const code = String(error.code ?? error.status ?? '').toLowerCase()

  // Email confirmation is disabled in this app.
  // If Supabase still returns this for an old unconfirmed account,
  // show a simple message instead of telling user to confirm email.
  if (
    msg.includes('email not confirmed') ||
    code === 'email_not_confirmed' ||
    msg.includes('email confirmation')
  ) {
    return 'This account was created before email confirmation was disabled. Please create a new account or contact support.'
  }

  if (
    msg.includes('database error saving new user') ||
    msg.includes('database error') ||
    msg.includes('handle_new_user') ||
    (msg.includes('profiles') && msg.includes('error'))
  ) {
    return 'We could not finish setting up your profile. Please try again in a moment or contact support.'
  }

  if (
    code === 'weak_password' ||
    msg.includes('weak password') ||
    msg.includes('password is too weak') ||
    (msg.includes('password') && msg.includes('weak'))
  ) {
    if (msg.includes('6')) {
      return 'Password is too weak. Use at least 6 characters. We recommend 8+ with letters and numbers.'
    }
    return 'Password is too weak. Use at least 8 characters with letters and numbers.'
  }

  if (
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    msg.includes('user already registered') ||
    msg.includes('email address is already') ||
    msg.includes('already exists')
  ) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  if (
    msg.includes('invalid email') ||
    msg.includes('valid email') ||
    msg.includes('unable to validate email')
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    msg.includes('wrong password') ||
    code === 'invalid_credentials'
  ) {
    return 'Wrong email or password. Please try again.'
  }

  if (msg.includes('signup is disabled')) {
    return 'Sign up is currently disabled. Please try again later.'
  }

  if (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('too many attempts')
  ) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Connection problem. Check your internet and try again.'
  }

  return error.message || 'Something went wrong. Please try again.'
}

export function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must include at least one letter.'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must include at least one number.'
  }

  return null
}

/**
 * Email confirmation is disabled for this app.
 * Always return true so the frontend does not block login.
 *
 * @param {import('@supabase/supabase-js').User | null | undefined} user
 */
export function isEmailConfirmed(user) {
  return true
}

export function getAuthRedirectUrl() {
  if (typeof window === 'undefined') return undefined
  return window.location.origin
}