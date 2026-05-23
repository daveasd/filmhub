import React, { useState, useEffect } from 'react';
import { Search, Info, SlidersHorizontal } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { MovieGridSkeleton } from '../components/SkeletonLoader';
import { searchMovies } from '../services/tmdb';
import { getMovieId } from '../utils/movies';

export default function SearchPage({
  onCardClick,
  watchlist,
  watched,
  onWatchlistToggle,
  onWatchedToggle,
  onQuickView,
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debouncing Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    let isMounted = true;

    async function executeSearch() {
      if (!debouncedQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchMovies(debouncedQuery);
        
        if (isMounted) {
          setResults(searchResults);
        }
      } catch (err) {
        console.error("Search failed:", err);
        if (isMounted) {
          setError("Failed to search movies. Please check your connection.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  const isMovieInList = (movieId, list) =>
    list.some((m) => getMovieId(m) === movieId);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="mb-8 text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <Search className="h-7 w-7 text-brand-gold" />
          Search Database
        </h1>
        <p className="text-gray-400 text-sm mt-1">Search through millions of films and find reviews</p>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-8 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type movie titles, actors, directors..."
          className="w-full bg-dark-card border border-dark-border rounded-xl pl-12 pr-4 py-3.5 text-md text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all duration-200"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Status States */}
      {error && (
        <div className="mb-8 rounded-lg bg-brand-red/10 border border-brand-red/30 p-4 text-sm text-brand-red text-left">
          {error}
        </div>
      )}

      {/* Grid Results */}
      {loading ? (
        <MovieGridSkeleton count={12} />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {results.map((movie) => (
            <MovieCard
              key={getMovieId(movie)}
              movie={movie}
              onCardClick={onCardClick}
              inWatchlist={isMovieInList(getMovieId(movie), watchlist)}
              inWatched={isMovieInList(getMovieId(movie), watched)}
              onWatchlistToggle={onWatchlistToggle}
              onWatchedToggle={onWatchedToggle}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      ) : debouncedQuery.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-dark-border rounded-2xl bg-dark-card/45">
          <Info className="h-10 w-10 text-gray-600 mb-3" />
          <p className="text-lg font-medium text-gray-400">No results found for "{debouncedQuery}"</p>
          <p className="text-sm text-gray-500 mt-1">Try check spelling or use simpler search phrases</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 border border-dashed border-dark-border rounded-2xl bg-dark-card/25">
          <Search className="h-12 w-12 text-gray-600 mb-4 animate-bounce" />
          <p className="text-lg font-medium text-gray-400">Discover Something New</p>
          <p className="text-sm text-gray-500 mt-1">Start typing to search trending films and releases</p>
        </div>
      )}
    </div>
  );
}
