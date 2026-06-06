import { supabase } from '../lib/supabase';

// Generate a simple session ID for basic session tracking (cleared on tab close)
const getSessionId = () => {
  let sid = sessionStorage.getItem('filmhub_sid');
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('filmhub_sid', sid);
  }
  return sid;
};

export async function logEvent(eventName, metadata = {}, userId = null) {
  // Ensure we don't log sensitive info
  const safeMetadata = { ...metadata };
  delete safeMetadata.password;
  delete safeMetadata.token;
  delete safeMetadata.jwt;
  delete safeMetadata.api_key;

  const payload = {
    event_name: eventName,
    user_id: userId,
    session_id: getSessionId(),
    metadata: safeMetadata,
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    // Graceful fallback if no Supabase (e.g. strict guest mode with no backend)
    console.debug('[Analytics Fallback]', payload);
    return;
  }

  try {
    // Fire and forget
    supabase.from('analytics_events').insert(payload).then(({ error }) => {
      if (error) {
        console.debug('[Analytics Error]', error.message);
      }
    });
  } catch (err) {
    console.debug('[Analytics Catch Error]', err.message);
  }
}
