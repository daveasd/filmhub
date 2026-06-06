import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { StaticCard, StaticSectionTitle } from '../StaticPageLayout';
import { fetchAnalyticsSummary } from '../../services/adminService';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchAnalyticsSummary();
      if (cancelled) return;
      if (result.error) setError(result.error);
      setData(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <StaticCard>
        <p className="text-red-400 text-sm text-center">{error}</p>
        <p className="text-gray-500 text-xs text-center mt-2">
          Ensure the analytics_events table exists (run supabase_phase6_admin.sql).
        </p>
      </StaticCard>
    );
  }

  const maxDaily = Math.max(...(data.dailyActivity.map((d) => d.count) || [1]), 1);

  return (
    <div className="space-y-6">
      <StaticCard>
        <p className="text-3xl font-bold text-white tabular-nums">{data.totalEvents}</p>
        <p className="text-sm text-gray-400 mt-1">Total analytics events</p>
      </StaticCard>

      <div>
        <StaticSectionTitle>Events by type</StaticSectionTitle>
        {data.eventsByType.length === 0 ? (
          <StaticCard>
            <p className="text-gray-400 text-sm text-center">No events recorded yet.</p>
          </StaticCard>
        ) : (
          <div className="space-y-2">
            {data.eventsByType.map((item) => (
              <StaticCard key={item.name} className="flex items-center justify-between gap-3 py-3">
                <span className="text-sm text-white truncate">{item.name}</span>
                <span className="text-brand-gold font-bold tabular-nums shrink-0">{item.count}</span>
              </StaticCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <StaticSectionTitle>Daily activity (last 7 days)</StaticSectionTitle>
        {data.dailyActivity.length === 0 ? (
          <StaticCard>
            <p className="text-gray-400 text-sm text-center">No recent activity.</p>
          </StaticCard>
        ) : (
          <StaticCard>
            <div className="flex items-end gap-2 h-32">
              {data.dailyActivity.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div
                    className="w-full bg-brand-gold/80 rounded-t min-h-[4px]"
                    style={{ height: `${(day.count / maxDaily) * 100}%` }}
                    title={`${day.count} events`}
                  />
                  <span className="text-[10px] text-gray-500 truncate w-full text-center">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </StaticCard>
        )}
      </div>

      <div>
        <StaticSectionTitle>Top active users</StaticSectionTitle>
        {data.topUsers.length === 0 ? (
          <StaticCard>
            <p className="text-gray-400 text-sm text-center">No user activity tracked.</p>
          </StaticCard>
        ) : (
          <div className="space-y-2">
            {data.topUsers.map((u) => (
              <StaticCard key={u.userId} className="flex justify-between py-3">
                <span className="text-xs text-gray-400 font-mono truncate">{u.userId}</span>
                <span className="text-white font-semibold tabular-nums">{u.count}</span>
              </StaticCard>
            ))}
          </div>
        )}
      </div>

      <div>
        <StaticSectionTitle>Latest events</StaticSectionTitle>
        {data.latestEvents.length === 0 ? (
          <StaticCard>
            <p className="text-gray-400 text-sm text-center">No events yet.</p>
          </StaticCard>
        ) : (
          <div className="space-y-2">
            {data.latestEvents.map((evt) => (
              <StaticCard key={evt.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-white">{evt.event_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
                {evt.user_id && (
                  <p className="text-xs text-gray-500 font-mono truncate">{evt.user_id}</p>
                )}
              </StaticCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
