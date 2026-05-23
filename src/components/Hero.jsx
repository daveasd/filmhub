import React from 'react';
import { Play, Plus, Check, Star, Calendar, Clock } from 'lucide-react';

export default function Hero({ movie, inWatchlist, onWatchlistToggle, onPlayTrailer }) {
  if (!movie) return null;

  const { id, title, overview, backdrop_path, poster_path, vote_average, release_date, tagline, runtime } = movie;

  const getBackdropUrl = () => {
    if (!backdrop_path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600';
    if (backdrop_path.startsWith('http')) return backdrop_path;
    return `https://image.tmdb.org/t/p/original${backdrop_path}`;
  };

  const getPosterUrl = () => {
    if (!poster_path) return '';
    if (poster_path.startsWith('http')) return poster_path;
    return `https://image.tmdb.org/t/p/w500${poster_path}`;
  };

  const formattedRating = typeof vote_average === 'number' ? vote_average.toFixed(1) : 'N/A';
  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'TBA';

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] min-h-[500px] overflow-hidden flex items-end">
      {/* Background Image / Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={getBackdropUrl()}
          alt={title}
          className="w-full h-full object-cover object-top brightness-[0.4]"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600'; }}
        />
        {/* Gradient Overlay bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        {/* Gradient Overlay left (desktop) */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/90 via-dark-bg/20 to-transparent hidden md:block" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 border border-brand-gold/30 px-3 py-1 text-xs font-semibold text-brand-gold uppercase tracking-wider mb-4">
            Featured Spotlight
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-2 text-left">
            {title}
          </h1>

          {/* Tagline */}
          {tagline && (
            <p className="text-brand-gold/90 italic text-md md:text-lg mb-4 text-left font-medium">
              "{tagline}"
            </p>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-6">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
              <span className="font-bold text-white">{formattedRating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{releaseYear}</span>
            </div>
            {runtime && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{runtime} min</span>
              </div>
            )}
          </div>

          {/* Overview */}
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 text-left line-clamp-3 md:line-clamp-4">
            {overview}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {/* Play Trailer Button */}
            <button
              onClick={() => onPlayTrailer(id)}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-gold hover:bg-brand-gold/90 text-black px-6 py-3 font-bold transition-all duration-200 shadow-lg shadow-brand-gold/20"
            >
              <Play className="h-5 w-5 fill-black" />
              Watch Trailer
            </button>

            {/* Watchlist Toggle Button */}
            <button
              onClick={() => onWatchlistToggle(movie)}
              className={`flex items-center justify-center gap-2 rounded-lg border px-6 py-3 font-bold transition-all duration-200 ${
                inWatchlist
                  ? 'bg-transparent border-brand-gold text-brand-gold hover:bg-brand-gold/10'
                  : 'bg-dark-card/60 border-dark-border text-white hover:border-gray-500 hover:bg-dark-hover'
              }`}
            >
              {inWatchlist ? (
                <>
                  <Check className="h-5 w-5" />
                  In Watchlist
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Add to Watchlist
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
