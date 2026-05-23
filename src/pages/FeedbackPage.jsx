import React, { useState } from 'react';
import { MessageSquare, Loader2, CheckCircle2, Star } from 'lucide-react';
import StaticPageLayout, { StaticCard } from '../components/StaticPageLayout';
import { useToast } from '../contexts/ToastContext';
import { submitFeedback } from '../services/siteFormsService';

export default function FeedbackPage({ user }) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast('Please enter your feedback.', 'info');
      return;
    }

    setLoading(true);
    try {
      const result = await submitFeedback({
        rating,
        message,
        email,
        userId: user?.isGuest ? null : user?.id,
        username: user?.username ?? 'Guest',
      });
      setSubmitted(true);
      setMessage('');
      setRating(5);
      toast(
        result.storage === 'supabase'
          ? 'Feedback submitted. Thank you!'
          : 'Feedback saved locally. Thank you!',
      );
    } catch {
      toast('Could not submit feedback. Please try again.', 'info');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StaticPageLayout
      title="Feedback"
      subtitle="Share your experience with FilmHub — it helps shape future improvements."
      icon={MessageSquare}
    >
      {submitted ? (
        <StaticCard className="text-center py-10">
          <CheckCircle2 className="h-12 w-12 text-brand-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">Thanks for your feedback</h2>
          <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
            Your input was recorded and appreciated.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-6 text-sm text-brand-gold font-semibold hover:underline"
          >
            Send more feedback
          </button>
        </StaticCard>
      ) : (
        <StaticCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-3">Rating</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`flex h-11 w-11 items-center justify-center rounded-lg border transition-all ${
                      rating >= n
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-gold'
                        : 'border-dark-border text-gray-500 hover:border-brand-gold/40'
                    }`}
                    aria-label={`Rate ${n} out of 5`}
                  >
                    <Star className={`h-5 w-5 ${rating >= n ? 'fill-brand-gold' : ''}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{rating} of 5 stars</p>
            </div>

            <div>
              <label htmlFor="feedback-message" className="block text-sm font-semibold text-gray-300 mb-2">
                Message <span className="text-brand-red">*</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
                placeholder="What do you like? What could be better?"
                className="w-full rounded-lg bg-dark-bg border border-dark-border text-white placeholder-gray-600 px-4 py-3 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold resize-y"
              />
            </div>

            <div>
              <label htmlFor="feedback-email" className="block text-sm font-semibold text-gray-300 mb-2">
                Email (optional)
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg bg-dark-bg border border-dark-border text-white placeholder-gray-600 px-4 py-2.5 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-gold text-black font-bold px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[44px]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              Send feedback
            </button>
          </form>
        </StaticCard>
      )}
    </StaticPageLayout>
  );
}
