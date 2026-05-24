import React, { useState } from 'react';
import { Star, Bookmark, Eye, Info } from 'lucide-react';
import { getMovieId } from '../utils/movies';
import { TMDB_GENRES } from '../services/tmdb';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500';

export default function SearchResultCard({
  movie,
  onCardClick,
  inWatchlist,
  inWatched,
  onWatchlistToggle,
  onWatchedToggle,
}) {
  const { id, title, poster_path, vote_average, release_date, genre_ids, genres, overview } = movie;
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

  // Get genres from either genres list or genre_ids map
  const genreTags = genres
    ? genres.slice(0, 3).map((g) => g.name)
    : genre_ids
    ? genre_ids.slice(0, 3).map((gid) => TMDB_GENRES[gid]).filter(Boolean)
    : [];

  const movieId = getMovieId(movie);

  return (
    <div className="movie-card-cinematic group flex gap-3 p-3 sm:gap-4 sm:p-4 rounded-xl bg-dark-card border border-dark-border hover:border-brand-gold/30 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-all duration-300">
      {/* Poster */}
      <div
        className="w-24 sm:w-32 shrink-0 aspect-[2/3] overflow-hidden rounded-lg bg-dark-hover relative cursor-pointer"
        onClick={() => onCardClick(movieId)}
      >
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-dark-hover" />
        )}
        <img
          src={getPosterUrl()}
          alt={title}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setImgError(true);
            setImgLoaded(true);
          }}
        />
      </div>

      {/* Details info */}
      <div className="flex-1 flex flex-col justify-between min-w-0 text-left">
        <div>
          {/* Title & Year */}
          <div className="flex flex-wrap items-baseline gap-2 mb-1">
            <h3
              className="text-base sm:text-lg font-extrabold text-white group-hover:text-brand-gold transition-colors duration-200 cursor-pointer truncate max-w-full"
              onClick={() => onCardClick(movieId)}
              title={title}
            >
              {title}
            </h3>
            {getReleaseYear() && (
              <span className="text-xs sm:text-sm font-semibold text-gray-500">
                ({getReleaseYear()})
              </span>
            )}
          </div>

          {/* Rating and Genre chips */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="flex items-center gap-1 rounded bg-black/50 px-2 py-0.5 text-xs font-bold text-brand-gold border border-brand-gold/20">
              <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
              <span>{formattedRating}</span>
            </div>
            {genreTags.map((name) => (
              <span
                key={name}
                className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-dark-border"
              >
                {name}
              </span>
            ))}
          </div>

          {/* Overview snippet */}
          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3 mb-3 leading-relaxed">
            {overview || 'No synopsis available for this film.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onWatchlistToggle(movie)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              inWatchlist
                ? 'bg-brand-gold text-black border-brand-gold shadow-[0_0_8px_rgba(234,179,8,0.25)]'
                : 'glassmorphism border-white/20 text-white hover:border-brand-gold hover:text-brand-gold'
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${inWatchlist ? 'fill-black' : ''}`} />
            <span>{inWatchlist ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => onWatchedToggle(movie)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              inWatched
                ? 'bg-brand-red text-white border-brand-red shadow-[0_0_8px_rgba(225,29,72,0.25)]'
                : 'glassmorphism border-white/20 text-white hover:border-brand-red hover:text-brand-red'
            }`}
          >
            <Eye className={`h-3.5 w-3.5 ${inWatched ? 'fill-white' : ''}`} />
            <span>{inWatched ? 'Watched' : 'Seen'}</span>
          </button>

          <button
            type="button"
            onClick={() => onCardClick(movieId)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/20 text-gray-300 hover:border-brand-gold hover:text-white transition-all bg-dark-hover"
          >
            <Info className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
