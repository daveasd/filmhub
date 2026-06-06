import React, { useState, useMemo } from 'react';
import { Bookmark, Eye, Info, Trash2, ArrowLeftRight } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { getMovieId, uniqueMoviesById } from '../utils/movies';

export default function WatchlistPage({
  watchlist = [],
  watched = [],
  onCardClick,
  onWatchlistToggle,
  onWatchedToggle,
  onQuickView,
  onExplore,
}) {
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' or 'watched'

  const isMovieInList = (movieId, list) =>
    list.some((m) => getMovieId(m) === movieId);

  const activeList = useMemo(
    () => uniqueMoviesById(activeTab === 'watchlist' ? watchlist : watched),
    [activeTab, watchlist, watched],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-dark-bg text-left">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <Bookmark className="h-7 w-7 text-brand-gold" />
            My Library
          </h1>
          <p className="text-gray-400 text-sm mt-1">Organize your movies, plan what to watch, and track history</p>
        </div>

        {/* Tab Switches */}
        <div className="flex bg-dark-card border border-dark-border p-1.5 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
              activeTab === 'watchlist'
                ? 'bg-brand-gold text-black shadow-md shadow-brand-gold/15'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Watchlist ({watchlist.length})
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 ${
              activeTab === 'watched'
                ? 'bg-brand-red text-white shadow-md shadow-brand-red/15'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye className="h-4 w-4" />
            Watched ({watched.length})
          </button>
        </div>
      </div>

      {/* Grid Content */}
      {activeList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 border border-dashed border-dark-border rounded-2xl bg-dark-card/30">
          {activeTab === 'watchlist' ? (
            <>
              <Bookmark className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-400">Your watchlist is empty</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                Start saving movies you want to watch.
              </p>
              {onExplore && (
                <button
                  type="button"
                  onClick={onExplore}
                  className="mt-4 rounded-lg bg-brand-gold text-black font-bold text-sm px-5 py-2.5 hover:opacity-90 transition-opacity min-h-[44px]"
                >
                  Explore Movies
                </button>
              )}
            </>
          ) : (
            <>
              <Eye className="h-12 w-12 text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-400">No Watched History Yet</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm text-center">
                Toggle the checkmark on movies you've completed to build your watch stats and reviews history.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {activeList.map((movie) => {
            const movieId = getMovieId(movie);
            return (
            <div key={movieId} className="relative group">
              <MovieCard
                movie={movie}
                onCardClick={onCardClick}
                inWatchlist={isMovieInList(movieId, watchlist)}
                inWatched={isMovieInList(movieId, watched)}
                onWatchlistToggle={onWatchlistToggle}
                onWatchedToggle={onWatchedToggle}
                onQuickView={onQuickView}
              />
              
              {/* Quick Remove Overlay */}
              <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    if (activeTab === 'watchlist') {
                      onWatchlistToggle(movie);
                    } else {
                      onWatchedToggle(movie);
                    }
                  }}
                  title={activeTab === 'watchlist' ? 'Remove from Watchlist' : 'Remove from Watched'}
                  className="bg-black/80 hover:bg-brand-red/90 hover:text-white text-gray-400 p-2 rounded-lg border border-dark-border shadow transition-all duration-150"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
