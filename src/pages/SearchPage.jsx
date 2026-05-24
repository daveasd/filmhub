import React, { useState, useEffect } from 'react';
import { Search, Info, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import SearchResultCard from '../components/SearchResultCard';
import { MovieGridSkeleton } from '../components/SkeletonLoader';
import { searchMovies, discoverMovies, TMDB_GENRES } from '../services/tmdb';
import { getMovieId } from '../utils/movies';

const MOODS = [
  { key: 'happy', label: 'Happy', emoji: '😀', genres: ['35'] },
  { key: 'sad', label: 'Sad', emoji: '😢', genres: ['18'] },
  { key: 'dark', label: 'Dark', emoji: '🌙', genres: ['27', '53'] },
  { key: 'romantic', label: 'Romantic', emoji: '💖', genres: ['10749'] },
  { key: 'action', label: 'Action', emoji: '⚔️', genres: ['28'] },
  { key: 'mindblowing', label: 'Mind-bending', emoji: '🤯', genres: ['878'], minRating: '7.0' },
  { key: 'short', label: 'Short', emoji: '⏱️', maxRuntime: 'under90' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  { code: 'it', label: 'Italian' },
  { code: 'de', label: 'German' },
];

const YEARS = [
  '2025', '2024', '2023', '2022', '2021', '2020',
  '2010s', '2000s', '1990s', '1980s'
];

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
  const [rawResults, setRawResults] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedRuntime, setSelectedRuntime] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');
  const [selectedMood, setSelectedMood] = useState(null);

  // UI state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debouncing Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Handle Mood Preset Selection
  const handleMoodSelect = (mood) => {
    if (selectedMood?.key === mood.key) {
      // Toggle off
      setSelectedMood(null);
      setSelectedGenres([]);
      setSelectedRating('');
      setSelectedRuntime('');
    } else {
      setSelectedMood(mood);
      setSelectedGenres(mood.genres || []);
      setSelectedRating(mood.minRating || '');
      setSelectedRuntime(mood.maxRuntime || '');
    }
  };

  const handleGenreToggle = (genreId) => {
    setSelectedMood(null); // Clear mood if user customizes genres
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  };

  const handleResetFilters = () => {
    setSelectedGenres([]);
    setSelectedYear('');
    setSelectedRating('');
    setSelectedRuntime('');
    setSelectedLanguage('');
    setSortBy('popularity.desc');
    setSelectedMood(null);
  };

  // Fetch / Query execution
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (debouncedQuery.trim()) {
          // 1. Text query active: Fetch raw search results
          const searchResults = await searchMovies(debouncedQuery);
          if (isMounted) {
            setRawResults(searchResults);
          }
        } else {
          // 2. Discover mode: Fetch based on filters (or popular if filters empty)
          const discResults = await discoverMovies({
            genreIds: selectedGenres.map(Number),
            sortBy: sortBy,
            maxRuntime: selectedRuntime === 'under90' ? 90 : selectedRuntime === 'under120' ? 120 : selectedRuntime === 'under150' ? 150 : undefined,
            minVoteAverage: selectedRating ? parseFloat(selectedRating) : undefined,
            year: selectedYear && !selectedYear.endsWith('s') ? parseInt(selectedYear, 10) : undefined,
            language: selectedLanguage || undefined,
          });

          let finalResults = discResults;
          // Apply decade filter client-side for discover if selected
          if (selectedYear && selectedYear.endsWith('s')) {
            const decade = parseInt(selectedYear.substring(0, 4), 10);
            finalResults = finalResults.filter((m) => {
              if (!m.release_date) return false;
              const y = new Date(m.release_date).getFullYear();
              return y >= decade && y < decade + 10;
            });
          }

          if (isMounted) {
            setResults(finalResults);
          }
        }
      } catch (err) {
        console.error('Search/Discover load failed:', err);
        if (isMounted) {
          setError('Failed to query movies. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, selectedGenres, selectedYear, selectedRating, selectedRuntime, selectedLanguage, sortBy]);

  // Client-side filtering when search query is active
  useEffect(() => {
    if (!debouncedQuery.trim()) return;

    let filtered = [...rawResults];

    // Filter by genre
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((m) => {
        const ids = m.genre_ids ?? m.genres?.map((g) => g.id) ?? [];
        return selectedGenres.every((gid) => ids.map(String).includes(String(gid)));
      });
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter((m) => {
        if (!m.release_date) return false;
        const y = new Date(m.release_date).getFullYear();
        if (selectedYear.endsWith('s')) {
          const decade = parseInt(selectedYear.substring(0, 4), 10);
          return y >= decade && y < decade + 10;
        }
        return y === parseInt(selectedYear, 10);
      });
    }

    // Filter by rating
    if (selectedRating) {
      const minRate = parseFloat(selectedRating);
      filtered = filtered.filter((m) => m.vote_average >= minRate);
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter((m) => m.original_language === selectedLanguage);
    }

    // Sort
    if (sortBy === 'popularity.desc') {
      filtered.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    } else if (sortBy === 'vote_average.desc') {
      filtered.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    } else if (sortBy === 'primary_release_date.desc') {
      filtered.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    }

    setResults(filtered);
  }, [rawResults, debouncedQuery, selectedGenres, selectedYear, selectedRating, selectedLanguage, sortBy]);

  const isMovieInList = (movieId, list) =>
    list.some((m) => getMovieId(m) === movieId);

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedYear ||
    selectedRating ||
    selectedRuntime ||
    selectedLanguage ||
    selectedMood;

  // Render Filters Section Component
  const renderFiltersContent = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-300 p-2.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="popularity.desc">Popularity</option>
          <option value="vote_average.desc">Rating</option>
          <option value="primary_release_date.desc">Release Date</option>
        </select>
      </div>

      {/* Genres list */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Genres</label>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
          {Object.entries(TMDB_GENRES).map(([id, name]) => {
            const isSelected = selectedGenres.includes(id);
            return (
              <button
                type="button"
                key={id}
                onClick={() => handleGenreToggle(id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-brand-gold/15 border-brand-gold text-brand-gold font-bold shadow-[0_0_8px_rgba(234,179,8,0.15)]'
                    : 'bg-dark-bg/60 border-dark-border text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Release Year */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Release Year</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-300 p-2.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="">Any Year</option>
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Minimum Rating */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Minimum Rating</label>
        <select
          value={selectedRating}
          onChange={(e) => {
            setSelectedMood(null);
            setSelectedRating(e.target.value);
          }}
          className="w-full bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-300 p-2.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="">Any Rating</option>
          <option value="8.0">8.0+ Exceptional</option>
          <option value="7.0">7.0+ Good</option>
          <option value="6.0">6.0+ Decent</option>
          <option value="5.0">5.0+ Average</option>
        </select>
      </div>

      {/* Runtime */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Duration</label>
        <select
          value={selectedRuntime}
          onChange={(e) => {
            setSelectedMood(null);
            setSelectedRuntime(e.target.value);
          }}
          className="w-full bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-300 p-2.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="">Any Length</option>
          <option value="under90">Under 90 min</option>
          <option value="under120">Under 120 min</option>
          <option value="under150">Under 150 min</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Language</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-lg text-sm text-gray-300 p-2.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="">Any Language</option>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full flex items-center justify-center gap-1.5 bg-brand-red/10 border border-brand-red/30 hover:bg-brand-red/20 text-brand-red font-bold rounded-lg py-2.5 text-xs transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-dark-bg">
      {/* Header */}
      <div className="mb-6 text-left">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <Search className="h-7 w-7 text-brand-gold" />
          Discover & Search
        </h1>
        <p className="text-gray-400 text-sm mt-1">Discover films by filters, explore ratings and streaming availability</p>
      </div>

      {/* Top Search Input & Mobile filters trigger */}
      <div className="flex gap-3 mb-6 max-w-4xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type movie titles, actors, directors..."
            className="w-full bg-dark-card border border-dark-border rounded-xl pl-12 pr-4 py-3 text-md text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all duration-200"
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
        <button
          type="button"
          onClick={() => setShowMobileFilters(true)}
          className="lg:hidden flex items-center gap-1.5 bg-dark-card border border-dark-border rounded-xl px-4 py-3 text-sm text-gray-300 hover:border-brand-gold hover:text-white transition-all"
        >
          <SlidersHorizontal className="h-5 w-5 text-brand-gold" />
          Filters
        </button>
      </div>

      {/* Mood Presets */}
      <div className="mb-6 text-left">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">Filter by Mood</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {MOODS.map((mood) => {
            const isSelected = selectedMood?.key === mood.key;
            return (
              <button
                type="button"
                key={mood.key}
                onClick={() => handleMoodSelect(mood)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all border ${
                  isSelected
                    ? 'bg-brand-gold text-black border-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.25)] scale-105'
                    : 'glassmorphism border-white/10 text-gray-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Filters Chips Row */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 text-left">
          <span className="text-xs font-semibold text-gray-500">Active Filters:</span>
          {selectedMood && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-brand-gold/15 border border-brand-gold/30 text-brand-gold px-2.5 py-0.5">
              Mood: {selectedMood.label}
              <button onClick={() => handleMoodSelect(selectedMood)}>
                <X className="h-3 w-3 hover:text-white" />
              </button>
            </span>
          )}
          {selectedGenres.map((gid) => (
            <span key={gid} className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-white/5 border border-dark-border text-gray-300 px-2.5 py-0.5">
              {TMDB_GENRES[gid]}
              <button onClick={() => handleGenreToggle(gid)}>
                <X className="h-3 w-3 hover:text-brand-red" />
              </button>
            </span>
          ))}
          {selectedYear && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-white/5 border border-dark-border text-gray-300 px-2.5 py-0.5">
              Year: {selectedYear}
              <button onClick={() => setSelectedYear('')}>
                <X className="h-3 w-3 hover:text-brand-red" />
              </button>
            </span>
          )}
          {selectedRating && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-white/5 border border-dark-border text-gray-300 px-2.5 py-0.5">
              Rating: {selectedRating}+
              <button onClick={() => setSelectedRating('')}>
                <X className="h-3 w-3 hover:text-brand-red" />
              </button>
            </span>
          )}
          {selectedRuntime && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-white/5 border border-dark-border text-gray-300 px-2.5 py-0.5">
              Runtime: {selectedRuntime === 'under90' ? '< 90m' : selectedRuntime === 'under120' ? '< 120m' : '< 150m'}
              <button onClick={() => setSelectedRuntime('')}>
                <X className="h-3 w-3 hover:text-brand-red" />
              </button>
            </span>
          )}
          {selectedLanguage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold rounded-md bg-white/5 border border-dark-border text-gray-300 px-2.5 py-0.5">
              Lang: {LANGUAGES.find((l) => l.code === selectedLanguage)?.label}
              <button onClick={() => setSelectedLanguage('')}>
                <X className="h-3 w-3 hover:text-brand-red" />
              </button>
            </span>
          )}
          <button
            onClick={handleResetFilters}
            className="text-xs font-bold text-brand-red hover:underline ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1 bg-dark-card border border-dark-border rounded-xl p-5 h-fit text-left">
          <h3 className="text-md font-extrabold text-white mb-4 border-b border-dark-border pb-2 flex items-center gap-2">
            <SlidersHorizontal className="h-4.5 w-4.5 text-brand-gold" />
            Filters Panel
          </h3>
          {renderFiltersContent()}
        </div>

        {/* Results grid */}
        <div className="col-span-1 lg:col-span-3 space-y-4">
          {error && (
            <div className="rounded-lg bg-brand-red/10 border border-brand-red/30 p-4 text-sm text-brand-red text-left">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-40 bg-dark-card/40 border border-dark-border rounded-xl animate-pulse" />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((movie) => (
                <SearchResultCard
                  key={getMovieId(movie)}
                  movie={movie}
                  onCardClick={onCardClick}
                  inWatchlist={isMovieInList(getMovieId(movie), watchlist)}
                  inWatched={isMovieInList(getMovieId(movie), watched)}
                  onWatchlistToggle={onWatchlistToggle}
                  onWatchedToggle={onWatchedToggle}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 border border-dashed border-dark-border rounded-2xl bg-dark-card/45">
              <Info className="h-10 w-10 text-gray-600 mb-3" />
              <p className="text-lg font-medium text-gray-400">
                {debouncedQuery.trim() ? `No results found for "${debouncedQuery}"` : 'No movies found matching these filters'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Try resetting filters or adjusting search terms</p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 bg-brand-gold hover:bg-brand-gold/90 text-black font-bold px-4 py-2 rounded-lg text-xs transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Filter Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-80 h-full bg-dark-card border-l border-dark-border p-6 overflow-y-auto text-left shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-dark-border pb-3 mb-5">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <SlidersHorizontal className="h-4.5 w-4.5 text-brand-gold" />
                  Filters
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-full bg-dark-hover p-1.5 text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderFiltersContent()}
            </div>
            <button
              type="button"
              onClick={() => setShowMobileFilters(false)}
              className="mt-8 w-full bg-brand-gold hover:bg-brand-gold/90 text-black font-bold py-2.5 rounded-lg text-sm transition-all"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
