export const INTRO_SEEN_KEY = 'filmhub_intro_seen';
export const GUEST_SESSION_KEY = 'filmhub_guest_session';

export function hasIntroBeenSeen() {
  return localStorage.getItem(INTRO_SEEN_KEY) === 'true';
}

export function markIntroSeen() {
  localStorage.setItem(INTRO_SEEN_KEY, 'true');
}

export function clearIntroSeen() {
  localStorage.removeItem(INTRO_SEEN_KEY);
}

export function setGuestSession() {
  sessionStorage.setItem(GUEST_SESSION_KEY, 'true');
}

export function hasGuestSession() {
  return sessionStorage.getItem(GUEST_SESSION_KEY) === 'true';
}

export function clearGuestSession() {
  sessionStorage.removeItem(GUEST_SESSION_KEY);
}

/** Clear intro + guest session — use in dev tools to replay intro */
export function resetIntroForTesting() {
  clearIntroSeen();
  clearGuestSession();
}
