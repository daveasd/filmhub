import React, { useState } from 'react';
import { Star, Bookmark, Eye, Maximize2 } from 'lucide-react';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500';

export default function MovieCard({
  movie,
  onCardClick,
  onQuickView,
  inWatchlist,
  inWatched,
  onWatchlistToggle,
  onWatchedToggle,
}) {
  const { id, title, poster_path, vote_average, release_date, genre_ids, genres } = movie;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const getPosterUrl = () => {
    if (imgError || !poster_path) return PLACEHOLDER;
    if (poster_path.startsWith('http')) return poster_path;
    return `https://image.tmdb.org/t/p/w500${poster_path}`;
  };

  const getReleaseYear = () => {
    if (!release_date) return '';
    return new Date(release_date).getFullYear();
  };

  const formattedRating =
    typeof vote_average === 'number' ? vote_average.toFixed(1) : 'N/A';

  const genreTags =
    genres?.slice(0, 2).map((g) => g.name) ??
    (genre_ids?.length ? [] : []);

  return (
    <div className="movie-card-cinematic group relative flex flex-col overflow-hidden rounded-xl bg-dark-card border border-dark-border">
      <div
        className="movie-card-poster aspect-[2/3] w-full overflow-hidden bg-dark-hover cursor-pointer relative"
        onClick={() => onCardClick(id)}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-dark-hover" />
        )}
        <img
          src={getPosterUrl()}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
        />

        <div className="absolute top-2 left-2 rounded bg-black/75 px-2 py-0.5 text-[10px] font-bold text-gray-200 border border-white/10">
          {getReleaseYear() || 'TBA'}
        </div>

        <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-black/80 px-2 py-0.5 text-xs font-bold text-brand-gold border border-brand-gold/30">
          <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
          <span>{formattedRating}</span>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-400 flex flex-col justify-end p-3 pb-4">
          <div className="flex gap-2 justify-center">
            {onQuickView && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView(movie);
                }}
                title="Quick View"
                className="filmhub-btn-glow flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/90 border border-violet-400 text-white hover:bg-violet-500 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWatchlistToggle(movie);
              }}
              title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`filmhub-btn-glow flex h-10 w-10 items-center justify-center rounded-lg transition-all border ${
                inWatchlist
                  ? 'bg-brand-gold border-brand-gold text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                  : 'glassmorphism border-white/20 text-white hover:border-brand-gold hover:text-brand-gold'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-black' : ''}`} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWatchedToggle(movie);
              }}
              title={inWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
              className={`filmhub-btn-glow flex h-10 w-10 items-center justify-center rounded-lg transition-all border ${
                inWatched
                  ? 'bg-brand-red border-brand-red text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]'
                  : 'glassmorphism border-white/20 text-white hover:border-brand-red hover:text-brand-red'
              }`}
            >
              <Eye className={`h-4 w-4 ${inWatched ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex flex-1 flex-col p-3 cursor-pointer"
        onClick={() => onCardClick(id)}
      >
        <h3 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-brand-gold transition-colors duration-200 min-h-[2.5rem]">
          {title}
        </h3>
        {genreTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {genreTags.map((name) => (
              <span
                key={name}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-dark-border"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
