import { supabase } from '../lib/supabase';

const LS_REPORTS = 'filmhub_reports';
const LS_FEEDBACK = 'filmhub_feedback';

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

async function trySupabaseInsert(table, row) {
  if (!supabase) return { ok: false, reason: 'no-client' };
  try {
    const { error } = await supabase.from(table).insert(row);
    if (error) return { ok: false, reason: error.message };
    return { ok: true, storage: 'supabase' };
  } catch (e) {
    return { ok: false, reason: e?.message ?? 'unknown' };
  }
}

export async function submitReport({
  category,
  message,
  email = '',
  userId = null,
  username = '',
}) {
  const payload = {
    category,
    message: message.trim(),
    email: email.trim() || null,
    user_id: userId,
    username: username || null,
    created_at: new Date().toISOString(),
  };

  const supabaseResult = await trySupabaseInsert('reports', payload);
  if (supabaseResult.ok) return supabaseResult;

  const items = readLocal(LS_REPORTS);
  items.unshift({ id: `r_${Date.now()}`, ...payload });
  writeLocal(LS_REPORTS, items.slice(0, 100));
  return { ok: true, storage: 'localStorage' };
}

export async function submitFeedback({
  rating,
  message,
  email = '',
  userId = null,
  username = '',
}) {
  const payload = {
    rating: Number(rating),
    message: message.trim(),
    email: email.trim() || null,
    user_id: userId,
    username: username || null,
    created_at: new Date().toISOString(),
  };

  const supabaseResult = await trySupabaseInsert('feedback', payload);
  if (supabaseResult.ok) return supabaseResult;

  const items = readLocal(LS_FEEDBACK);
  items.unshift({ id: `f_${Date.now()}`, ...payload });
  writeLocal(LS_FEEDBACK, items.slice(0, 100));
  return { ok: true, storage: 'localStorage' };
}
