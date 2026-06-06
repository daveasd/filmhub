import React, { useEffect, useState } from 'react';
import {
  Users,
  Star,
  Bookmark,
  AlertCircle,
  MessageSquare,
  Activity,
  UserCheck,
} from 'lucide-react';
import AdminStatCard from './AdminStatCard';
import { fetchDashboardStats } from '../../services/adminService';

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-dark-card border border-dark-border rounded-xl p-4 h-28 animate-pulse"
        />
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDashboardStats();
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <OverviewSkeleton />;

  if (error) {
    return (
      <div className="bg-dark-card border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 text-center text-gray-400">
        No overview data available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <AdminStatCard title="Total Users" value={stats.users} icon={Users} />
      <AdminStatCard title="Public Profiles" value={stats.publicProfiles} icon={UserCheck} />
      <AdminStatCard title="Total Reviews" value={stats.reviews} icon={Star} />
      <AdminStatCard title="Watchlist Items" value={stats.watchlist} icon={Bookmark} />
      <AdminStatCard title="Total Reports" value={stats.reports} icon={AlertCircle} />
      <AdminStatCard
        title="Pending Reports"
        value={stats.pendingReports}
        icon={AlertCircle}
        accent="red"
      />
      <AdminStatCard title="Total Feedback" value={stats.feedback} icon={MessageSquare} />
      <AdminStatCard
        title="Analytics Events"
        value={stats.analyticsEvents}
        icon={Activity}
        accent="blue"
      />
    </div>
  );
}
