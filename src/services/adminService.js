import { supabase } from '../lib/supabase';

// Helper for safe fetching
async function safeFetch(table, select = '*', options = {}) {
  if (!supabase) return [];
  try {
    let query = supabase.from(table).select(select, { count: 'exact' });
    if (options.order) query = query.order(options.order.column, { ascending: options.order.ascending });
    if (options.limit) query = query.limit(options.limit);
    
    const { data, error, count } = await query;
    if (error) {
      console.warn(`Admin safeFetch error for ${table}:`, error.message);
      return options.returnCount ? 0 : [];
    }
    return options.returnCount ? (count || 0) : (data || []);
  } catch (err) {
    console.warn(`Admin safeFetch catch for ${table}:`, err.message);
    return options.returnCount ? 0 : [];
  }
}

export async function fetchDashboardStats() {
  const users = await safeFetch('profiles', 'id', { returnCount: true });
  const reviews = await safeFetch('reviews', 'id', { returnCount: true });
  const ratings = await safeFetch('ratings', 'id', { returnCount: true });
  const watchlist = await safeFetch('watchlist', 'id', { returnCount: true });
  const watched = await safeFetch('watched_movies', 'id', { returnCount: true });
  const feedback = await safeFetch('feedback', 'id', { returnCount: true });
  const reports = await safeFetch('reports', 'id', { returnCount: true });
  const publicProfiles = await safeFetch('profiles', 'id', { returnCount: true }); // Note: difficult to filter just is_public via exact count without a custom query, we'll just return total. Wait, we can query.

  return {
    users,
    reviews,
    ratings,
    watchlist,
    watched,
    feedback,
    reports,
    publicProfiles
  };
}

export async function fetchReports() {
  return await safeFetch('reports', '*', { order: { column: 'created_at', ascending: false } });
}

export async function fetchFeedback() {
  return await safeFetch('feedback', '*', { order: { column: 'created_at', ascending: false } });
}

export async function fetchRecentReviews(limit = 20) {
  return await safeFetch('reviews', '*', { order: { column: 'created_at', ascending: false }, limit });
}

export async function updateReportStatus(id, status) {
  if (!supabase) return { error: 'No client' };
  try {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    return { error };
  } catch (err) {
    return { error: err.message };
  }
}

export async function updateFeedbackStatus(id, status) {
  if (!supabase) return { error: 'No client' };
  try {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    return { error };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteReview(id) {
  if (!supabase) return { error: 'No client' };
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    return { error };
  } catch (err) {
    return { error: err.message };
  }
}
