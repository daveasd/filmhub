import React, { useEffect, useState } from 'react';
import { Shield, Users, FileText, MessageSquare, Star, Trash2, ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  fetchDashboardStats, 
  fetchReports, 
  fetchFeedback, 
  fetchRecentReviews, 
  updateReportStatus, 
  updateFeedbackStatus, 
  deleteReview 
} from '../services/adminService';

export default function AdminDashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const s = await fetchDashboardStats();
        setStats(s);
      } else if (activeTab === 'reports') {
        const r = await fetchReports();
        setReports(r);
      } else if (activeTab === 'feedback') {
        const f = await fetchFeedback();
        setFeedback(f);
      } else if (activeTab === 'reviews') {
        const rev = await fetchRecentReviews(50);
        setReviews(rev);
      }
    } catch (err) {
      console.error(err);
      toast('Failed to load admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (profile?.role !== 'admin') return;

    loadData();
  }, [authLoading, profile, activeTab]);

  if (authLoading) {
    return <div className="text-white text-center py-20">Loading admin...</div>;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleReportStatus = async (id, status) => {
    const { error } = await updateReportStatus(id, status);
    if (error) {
      toast('Failed to update status: ' + error, 'error');
    } else {
      toast('Status updated', 'success');
      setReports(reports.map(r => r.id === id ? { ...r, status } : r));
    }
  };

  const handleFeedbackStatus = async (id, status) => {
    const { error } = await updateFeedbackStatus(id, status);
    if (error) {
      toast('Failed to update status: ' + error, 'error');
    } else {
      toast('Status updated', 'success');
      setFeedback(feedback.map(f => f.id === id ? { ...f, status } : f));
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const { error } = await deleteReview(id);
    if (error) {
      toast('Failed to delete review: ' + error, 'error');
    } else {
      toast('Review deleted', 'success');
      setReviews(reviews.filter(r => r.id !== id));
    }
  };

  return (
    <StaticPageLayout
      title="Admin Dashboard"
      subtitle="Monitor users, content, and feedback."
      icon={Shield}
    >
      <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-hide border-b border-dark-border">
        {['overview', 'reports', 'feedback', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'bg-brand-gold text-black'
                : 'bg-dark-card text-gray-400 hover:text-white border border-dark-border'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading data...</div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Users" value={stats.users} icon={Users} />
              <StatCard title="Public Profiles" value={stats.publicProfiles} icon={Users} />
              <StatCard title="Total Reviews" value={stats.reviews} icon={Star} />
              <StatCard title="Total Ratings" value={stats.ratings} icon={Star} />
              <StatCard title="Watchlist Items" value={stats.watchlist} icon={FileText} />
              <StatCard title="Watched Movies" value={stats.watched} icon={FileText} />
              <StatCard title="Total Feedback" value={stats.feedback} icon={MessageSquare} />
              <StatCard title="Total Reports" value={stats.reports} icon={AlertCircle} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <StaticCard><p className="text-gray-400 text-center">No reports found.</p></StaticCard>
              ) : (
                reports.map(report => (
                  <StaticCard key={report.id} className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{report.category}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          report.status === 'reviewing' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>{report.status}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{report.message}</p>
                      <div className="text-xs text-gray-500">
                        By: {report.username || report.email || 'Anonymous'} • {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <select 
                        value={report.status} 
                        onChange={(e) => handleReportStatus(report.id, e.target.value)}
                        className="bg-dark-bg border border-dark-border rounded text-sm text-white px-2 py-1"
                      >
                        <option value="open">Open</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </StaticCard>
                ))
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <StaticCard><p className="text-gray-400 text-center">No feedback found.</p></StaticCard>
              ) : (
                feedback.map(item => (
                  <StaticCard key={item.id} className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">Rating: {item.rating}/5</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                          item.status === 'read' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>{item.status}</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{item.message}</p>
                      <div className="text-xs text-gray-500">
                        By: {item.username || item.email || 'Anonymous'} • {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <select 
                        value={item.status} 
                        onChange={(e) => handleFeedbackStatus(item.id, e.target.value)}
                        className="bg-dark-bg border border-dark-border rounded text-sm text-white px-2 py-1"
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>
                  </StaticCard>
                ))
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <StaticCard><p className="text-gray-400 text-center">No reviews found.</p></StaticCard>
              ) : (
                reviews.map(review => (
                  <StaticCard key={review.id} className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <div className="font-bold text-white mb-1">{review.movie_title}</div>
                      <p className="text-sm text-gray-300 mb-2">{review.content}</p>
                      <div className="text-xs text-gray-500">
                        Rating: {review.rating}/10 • User: {review.username} • {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-start">
                      <button 
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-400 hover:text-red-300 p-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete Review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </StaticCard>
                ))
              )}
            </div>
          )}
        </>
      )}
    </StaticPageLayout>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
      <Icon className="w-6 h-6 text-brand-gold mb-2" />
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</div>
    </div>
  );
}
