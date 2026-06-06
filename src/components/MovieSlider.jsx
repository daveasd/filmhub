import React, { useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';
import { MovieCardSkeleton } from './SkeletonLoader';
import { uniqueMoviesById, getMovieId } from '../utils/movies';

export default function MovieSlider({
  title,
  movies = [],
  loading = false,
  onCardClick,
  watchlist = [],
  watched = [],
  onWatchlistToggle,
  onWatchedToggle,
  onQuickView,
}) {
  const sliderRef = useRef(null);

  const displayMovies = useMemo(() => uniqueMoviesById(movies), [movies]);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      
      sliderRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth'
      });
    }
  };

  const isMovieInList = (movieId, list) =>
    list.some((m) => getMovieId(m) === movieId);

  return (
    <div className="relative group my-8">
      <h2 className="text-xl md:text-2xl font-bold text-white mb-4 pl-4 md:pl-8 text-left border-l-4 border-brand-gold">
        {title}
      </h2>

      <button
        type="button"
        onClick={() => scroll('left')}
        className="absolute left-2 md:left-4 top-[50%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-gold hover:text-black hover:scale-105 duration-200"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => scroll('right')}
        className="absolute right-2 md:right-4 top-[50%] -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-gold hover:text-black hover:scale-105 duration-200"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        ref={sliderRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-none px-4 md:px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={`skel-${title}-${idx}`} className="w-[150px] sm:w-[180px] md:w-[200px] shrink-0">
              <MovieCardSkeleton />
            </div>
          ))
        ) : displayMovies.length === 0 ? (
          <div className="flex h-40 w-full items-center justify-center text-gray-500 text-sm">
            No movies available
          </div>
        ) : (
          displayMovies.map((movie) => {
            const movieId = getMovieId(movie);
            return (
              <div key={movie.id} className="w-[150px] sm:w-[180px] md:w-[200px] shrink-0">
                <MovieCard
                  movie={movie}
                  onCardClick={onCardClick}
                  inWatchlist={isMovieInList(movieId, watchlist)}
                  inWatched={isMovieInList(movieId, watched)}
                  onWatchlistToggle={onWatchlistToggle}
                  onWatchedToggle={onWatchedToggle}
                  onQuickView={onQuickView}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
