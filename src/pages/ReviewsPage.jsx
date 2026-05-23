import React from 'react';
import { Star, MessageSquare, Trash2, Calendar, Film, ExternalLink } from 'lucide-react';

export default function ReviewsPage({
  userReviews = [],
  onDeleteReview,
  onCardClick,
  user,
}) {
  // Filter reviews by the current user
  const currentUserReviews = userReviews.filter((r) => r.author === user?.username);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 min-h-screen bg-dark-bg text-left">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <MessageSquare className="h-7 w-7 text-brand-gold" />
          My Written Reviews
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage and edit your reviews for all films</p>
      </div>

      {currentUserReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-dark-border rounded-2xl bg-dark-card/30">
          <MessageSquare className="h-12 w-12 text-gray-600 mb-4 animate-pulse" />
          <p className="text-lg font-medium text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
            Be the first to share your thoughts — open any movie and write a review.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentUserReviews.map((review) => (
            <div
              key={review.id}
              className="bg-dark-card border border-dark-border rounded-xl p-5 hover:border-brand-gold/30 transition-all duration-200"
            >
              {/* Review Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onCardClick(review.movieId ?? review.movie_id)}>
                  <Film className="h-4.5 w-4.5 text-brand-gold" />
                  <h3 className="font-bold text-white group-hover:text-brand-gold transition-colors flex items-center gap-1">
                    {review.movieTitle}
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  {/* Rating Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4.5 w-4.5 ${
                          idx < review.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(review.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {/* Spoiler warning if flagged */}
              {review.isSpoiler && (
                <div className="inline-flex items-center gap-1 bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded text-[10px] font-bold text-brand-red uppercase tracking-wider mb-2">
                  Contains Spoilers
                </div>
              )}

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line text-left bg-dark-bg/40 p-3 rounded-lg border border-dark-border/40">
                {review.content}
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-4 mt-4 pt-3 border-t border-dark-border/40 text-xs">
                <button
                  onClick={() => onCardClick(review.movieId)}
                  className="text-gray-400 hover:text-brand-gold transition-colors"
                >
                  Write or Edit in Movie Page
                </button>
                <button
                  onClick={() => onDeleteReview(review.id)}
                  className="flex items-center gap-1 text-gray-500 hover:text-brand-red transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
