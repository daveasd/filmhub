import React, { useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { StaticCard } from '../StaticPageLayout';
import { useToast } from '../../contexts/ToastContext';
import {
  fetchFeedback,
  updateFeedbackStatus,
  fetchReviewsForModeration,
  deleteReview,
} from '../../services/adminService';
import AdminConfirmModal from './AdminConfirmModal';

const FEEDBACK_STATUSES = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

const FEEDBACK_BADGE = {
  unread: 'bg-purple-500/20 text-purple-400',
  read: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
};

export default function AdminModeration() {
  const { toast } = useToast();
  const [section, setSection] = useState('feedback');
  const [feedback, setFeedback] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackFilter, setFeedbackFilter] = useState('unread');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (section === 'feedback') {
        const { data, error: fetchError } = await fetchFeedback({ status: feedbackFilter });
        if (fetchError) throw new Error(fetchError);
        setFeedback(data);
      } else {
        const { data, error: fetchError } = await fetchReviewsForModeration(50);
        if (fetchError) throw new Error(fetchError);
        setReviews(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [section, feedbackFilter]);

  const handleFeedbackStatus = async (id, status) => {
    const { error: updateError } = await updateFeedbackStatus(id, status);
    if (updateError) {
      toast(`Failed to update feedback: ${updateError}`, 'error');
      return;
    }
    toast('Feedback updated', 'success');
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  };

  const confirmDeleteReview = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error: deleteError } = await deleteReview(deleteTarget.id);
    setDeleting(false);

    if (deleteError) {
      toast(`Failed to delete review: ${deleteError}`, 'error');
      return;
    }

    toast('Review deleted', 'success');
    setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSection('feedback')}
          className={`px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${
            section === 'feedback'
              ? 'bg-brand-gold text-black'
              : 'bg-dark-card text-gray-400 border border-dark-border'
          }`}
        >
          Feedback
        </button>
        <button
          type="button"
          onClick={() => setSection('reviews')}
          className={`px-4 py-2 rounded-full text-sm font-semibold min-h-[40px] ${
            section === 'reviews'
              ? 'bg-brand-gold text-black'
              : 'bg-dark-card text-gray-400 border border-dark-border'
          }`}
        >
          Reviews
        </button>
      </div>

      {section === 'feedback' && (
        <select
          value={feedbackFilter}
          onChange={(e) => setFeedbackFilter(e.target.value)}
          className="rounded-lg bg-dark-bg border border-dark-border text-white px-4 py-2.5 min-h-[44px]"
        >
          {FEEDBACK_STATUSES.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading…
        </div>
      ) : error ? (
        <StaticCard>
          <p className="text-red-400 text-sm text-center">{error}</p>
        </StaticCard>
      ) : section === 'feedback' ? (
        feedback.length === 0 ? (
          <StaticCard>
            <p className="text-gray-400 text-center text-sm">No feedback to moderate.</p>
          </StaticCard>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <StaticCard key={item.id} className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-white">Rating: {item.rating ?? '—'}/5</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${FEEDBACK_BADGE[item.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {item.status ?? 'unread'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{item.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {item.username || item.email || 'Anonymous'} ·{' '}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <select
                  value={item.status ?? 'unread'}
                  onChange={(e) => handleFeedbackStatus(item.id, e.target.value)}
                  className="rounded-lg bg-dark-bg border border-dark-border text-white px-3 py-2 text-sm min-h-[40px] shrink-0"
                >
                  {FEEDBACK_STATUSES.filter((o) => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </StaticCard>
            ))}
          </div>
        )
      ) : reviews.length === 0 ? (
        <StaticCard>
          <p className="text-gray-400 text-center text-sm">No reviews found.</p>
        </StaticCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <StaticCard key={review.id} className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="min-w-0">
                <div className="font-bold text-white mb-1">{review.movie_title ?? 'Untitled'}</div>
                <p className="text-sm text-gray-300 break-words">{review.content}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Rating: {review.rating}/5 · @{review.author} ·{' '}
                  {new Date(review.created_at).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(review)}
                className="shrink-0 self-start text-red-400 hover:text-red-300 p-2 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                title="Delete review"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </StaticCard>
          ))}
        </div>
      )}

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete review?"
        message={
          deleteTarget
            ? `Permanently delete the review for "${deleteTarget.movie_title}" by @${deleteTarget.author}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete review"
        onConfirm={confirmDeleteReview}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
