import { supabase } from '../lib/supabase';

async function safeCount(table, filters = {}) {
  if (!supabase) return 0;
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
    const { count, error } = await query;
    if (error) {
      console.warn(`Admin count error (${table}):`, error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.warn(`Admin count catch (${table}):`, err.message);
    return 0;
  }
}

async function safeSelect(table, select = '*', options = {}) {
  if (!supabase) return { data: [], error: 'Supabase not configured' };
  try {
    let query = supabase.from(table).select(select);
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });
    }
    if (options.search && options.searchColumn) {
      query = query.ilike(options.searchColumn, `%${options.search}%`);
    }
    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
    }
    if (options.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      console.warn(`Admin select error (${table}):`, error.message);
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (err) {
    console.warn(`Admin select catch (${table}):`, err.message);
    return { data: [], error: err.message };
  }
}

export async function fetchDashboardStats() {
  const [
    users,
    reviews,
    watchlist,
    reports,
    pendingReports,
    feedback,
    analyticsEvents,
    publicProfiles,
  ] = await Promise.all([
    safeCount('profiles'),
    safeCount('reviews'),
    safeCount('watchlist'),
    safeCount('reports'),
    safeCount('reports', { status: 'open' }),
    safeCount('feedback'),
    safeCount('analytics_events'),
    safeCount('profiles', { is_public: true }),
  ]);

  return {
    users,
    reviews,
    watchlist,
    reports,
    pendingReports,
    feedback,
    analyticsEvents,
    publicProfiles,
  };
}

export async function fetchUsers({ search = '', role = '' } = {}) {
  const options = {
    order: { column: 'created_at', ascending: false },
    limit: 200,
  };
  if (role) options.filters = { role };
  if (search) {
    options.search = search;
    options.searchColumn = 'username';
  }
  return safeSelect('profiles', 'id, username, role, created_at, is_public', options);
}

export async function updateUserRole(userId, role) {
  if (!supabase) return { error: 'Supabase not configured' };
  if (!['user', 'admin'].includes(role)) {
    return { error: 'Invalid role' };
  }
  try {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteUser(userId) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchReports({ status = '' } = {}) {
  const options = {
    order: { column: 'created_at', ascending: false },
    limit: 100,
  };
  if (status) options.filters = { status };
  return safeSelect('reports', '*', options);
}

export async function updateReportStatus(id, status, adminNotes = null) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const updates = { status };
    if (adminNotes !== null) updates.admin_notes = adminNotes;
    const { error } = await supabase.from('reports').update(updates).eq('id', id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteReport(id) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchFeedback({ status = '' } = {}) {
  const options = {
    order: { column: 'created_at', ascending: false },
    limit: 100,
  };
  if (status) options.filters = { status };
  return safeSelect('feedback', '*', options);
}

export async function updateFeedbackStatus(id, status) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function deleteFeedback(id) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('feedback').delete().eq('id', id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchReviewsForModeration(limit = 50) {
  return safeSelect('reviews', '*', {
    order: { column: 'created_at', ascending: false },
    limit,
  });
}

export async function deleteReview(id) {
  if (!supabase) return { error: 'Supabase not configured' };
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    return { error: error?.message ?? null };
  } catch (err) {
    return { error: err.message };
  }
}

export async function fetchAnalyticsSummary() {
  if (!supabase) {
    return {
      totalEvents: 0,
      eventsByType: [],
      latestEvents: [],
      topUsers: [],
      dailyActivity: [],
      error: 'Supabase not configured',
    };
  }

  try {
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('id, event_name, user_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.warn('Analytics fetch error:', error.message);
      return {
        totalEvents: 0,
        eventsByType: [],
        latestEvents: [],
        topUsers: [],
        dailyActivity: [],
        error: error.message,
      };
    }

    const list = events ?? [];
    const typeCounts = {};
    const userCounts = {};
    const dayCounts = {};

    list.forEach((evt) => {
      typeCounts[evt.event_name] = (typeCounts[evt.event_name] || 0) + 1;
      if (evt.user_id) {
        userCounts[evt.user_id] = (userCounts[evt.user_id] || 0) + 1;
      }
      const day = evt.created_at?.slice(0, 10);
      if (day) dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const eventsByType = Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const dailyActivity = Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    const totalResult = await safeCount('analytics_events');

    return {
      totalEvents: totalResult,
      eventsByType,
      latestEvents: list.slice(0, 20),
      topUsers,
      dailyActivity,
      error: null,
    };
  } catch (err) {
    console.warn('Analytics catch:', err.message);
    return {
      totalEvents: 0,
      eventsByType: [],
      latestEvents: [],
      topUsers: [],
      dailyActivity: [],
      error: err.message,
    };
  }
}
