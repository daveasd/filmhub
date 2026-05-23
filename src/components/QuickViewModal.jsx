import React from 'react'
import { X, Star, Calendar, Bookmark, Eye, ExternalLink } from 'lucide-react'

export default function QuickViewModal({
  movie,
  onClose,
  onViewDetails,
  inWatchlist,
  inWatched,
  onWatchlistToggle,
  onWatchedToggle,
}) {
  if (!movie) return null

  const poster = movie.poster_path?.startsWith('http')
    ? movie.poster_path
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500'

  const backdrop = movie.backdrop_path?.startsWith('http')
    ? movie.backdrop_path
    : movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : poster

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : 'TBA'
  const rating =
    typeof movie.vote_average === 'number'
      ? movie.vote_average.toFixed(1)
      : 'N/A'

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-dark-card border border-dark-border shadow-2xl">
        <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-2xl">
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-card via-dark-card/60 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white hover:bg-brand-red transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 pb-5 -mt-16 relative">
          <div className="flex gap-4">
            <img
              src={poster}
              alt={movie.title}
              className="w-24 h-36 object-cover rounded-lg border-2 border-dark-border shadow-xl shrink-0"
            />
            <div className="pt-16 sm:pt-14 min-w-0">
              <h2 className="text-xl font-bold text-white line-clamp-2">{movie.title}</h2>
              <div className="flex flex-wrap gap-2 mt-2 text-xs">
                <span className="flex items-center gap-1 text-brand-gold font-bold bg-black/40 px-2 py-0.5 rounded">
                  <Star className="h-3.5 w-3.5 fill-brand-gold" />
                  {rating}
                </span>
                <span className="flex items-center gap-1 text-gray-400 bg-dark-bg px-2 py-0.5 rounded border border-dark-border">
                  <Calendar className="h-3 w-3" />
                  {year}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-400 line-clamp-4 leading-relaxed">
            {movie.overview || 'No overview available.'}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => {
                onViewDetails(movie.id)
                onClose()
              }}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-gold text-black font-bold py-3 text-sm hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="h-4 w-4" />
              View Details
            </button>
            <button
              type="button"
              onClick={() => onWatchlistToggle(movie)}
              className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
                inWatchlist
                  ? 'bg-brand-gold/20 border-brand-gold text-brand-gold'
                  : 'border-dark-border text-gray-300 hover:border-brand-gold hover:text-brand-gold'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-current' : ''}`} />
              {inWatchlist ? 'In List' : 'Watchlist'}
            </button>
            <button
              type="button"
              onClick={() => onWatchedToggle(movie)}
              className={`flex items-center justify-center gap-2 rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
                inWatched
                  ? 'bg-brand-red/20 border-brand-red text-brand-red'
                  : 'border-dark-border text-gray-300 hover:border-brand-red hover:text-brand-red'
              }`}
            >
              <Eye className={`h-4 w-4 ${inWatched ? 'fill-current' : ''}`} />
              Watched
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
