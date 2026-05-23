/**
 * Maps Supabase auth errors to user-friendly messages.
 */
export function mapAuthError(error) {
  if (!error) return null

  const msg = String(error.message ?? error.error_description ?? '').toLowerCase()
  const code = String(error.code ?? error.status ?? '').toLowerCase()

  if (
    msg.includes('database error saving new user') ||
    msg.includes('database error') ||
    msg.includes('handle_new_user') ||
    msg.includes('profiles')
  ) {
    return 'We could not finish setting up your account. Please try again in a moment.'
  }

  if (
    code === 'weak_password' ||
    msg.includes('weak password') ||
    msg.includes('password is too weak') ||
    (msg.includes('password') && msg.includes('weak'))
  ) {
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
    msg.includes('wrong password')
  ) {
    return 'Incorrect email or password. Please try again.'
  }

  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox.'
  }

  if (msg.includes('signup is disabled')) {
    return 'Sign up is currently disabled. Please try again later.'
  }

  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Connection problem. Check your internet and try again.'
  }

  return 'Something went wrong. Please try again.'
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
