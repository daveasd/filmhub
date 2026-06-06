import React, { useEffect, useState } from 'react';
import { X, Sparkles, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserRatings, getWatchlist, getWatchedMovies } from '../services/dataService';
import { normalizeMovie, uniqueMoviesById } from '../utils/movies';
import { ROUTES } from '../lib/routes';
import { getMovieDetails } from '../services/tmdb';
import { calculateTasteDNA } from '../utils/forYou';

export default function WrappedPage({ user, watchlist = [], watched = [], userReviews = [] }) {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highestRated, setHighestRated] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load user ratings on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserRatings(user.id)
      .then(setRatings)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Determine the highest‑rated movie
  useEffect(() => {
    if (!ratings?.length) return;
    const best = ratings.reduce((b, c) => (c.rating > (b?.rating ?? 0) ? c : b), null);
    if (best) {
      getMovieDetails(best.movie_id).then(setHighestRated).catch(() => setHighestRated(null));
    }
  }, [ratings]);

  const totalWatched = watched.length;
  const totalSaved = watchlist.length;
  const totalReviews = userReviews.filter(r => r.author === user?.username).length;
  const totalRatings = ratings.length;
  const averageRating = totalRatings ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / totalRatings).toFixed(1) : '—';

  const tasteDNA = calculateTasteDNA(watchlist, watched, ratings);
  const topGenre = tasteDNA.genres[0]?.name ?? 'N/A';
  const topThree = tasteDNA.genres.slice(0, 3).map(g => g.name).join(', ');
  const personality = tasteDNA.title;

  const copySummary = async () => {
    const summary = `My FilmHub Wrapped 🎬\nPersonality: ${personality}\nTop genre: ${topGenre}\nWatched: ${totalWatched} movies\nReviews: ${totalReviews}\nAverage rating: ${averageRating}\n\nCheck it out at ${window.location.origin + ROUTES.wrapped}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (e) { console.error('Copy failed', e); }
  };

  // Empty state when not enough data
  if (tasteDNA.totalMovies < 5) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center space-y-6 px-4">
        <Sparkles className="h-16 w-16 text-brand-gold animate-bounce" />
        <h2 className="text-2xl font-bold text-white">Unlock your FilmHub Wrapped</h2>
        <p className="text-gray-400 max-w-md">
          Watch, save, rate, and review more movies to unlock your personal cinematic summary.
        </p>
        <button
          onClick={() => navigate(ROUTES.search)}
          className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 font-semibold transition-transform hover:scale-105"
        >
          Explore Movies
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 my-8 glassmorphism rounded-xl border border-dark-border shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-extrabold text-white">Your FilmHub Wrapped</h1>
        <button onClick={() => navigate(ROUTES.home)} className="p-2 rounded-full bg-dark-card/70 hover:bg-dark-hover transition-colors">
          <X className="h-5 w-5 text-gray-300" />
        </button>
      </div>

      <section className="space-y-6 mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-gold">{personality}</h2>
          <p className="text-gray-300 mt-2">{tasteDNA.explanation}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-dark-card/30 rounded-lg border border-dark-border">
            <h3 className="text-lg font-medium text-white mb-1">Top Genre</h3>
            <p className="text-brand-gold text-2xl font-bold">{topGenre}</p>
            <p className="text-gray-400 text-sm">Top 3: {topThree}</p>
          </div>
          <div className="p-4 bg-dark-card/30 rounded-lg border border-dark-border">
            <h3 className="text-lg font-medium text-white mb-1">Stats</h3>
            <p className="text-gray-300">Saved: {totalSaved}</p>
            <p className="text-gray-300">Watched: {totalWatched}</p>
            <p className="text-gray-300">Reviews: {totalReviews}</p>
            <p className="text-gray-300">Ratings: {totalRatings} (avg {averageRating})</p>
          </div>
        </div>
        {highestRated && (
          <div className="flex flex-col items-center gap-3">
            <img
              src={`https://image.tmdb.org/t/p/w200${highestRated.poster_path}`}
              alt={highestRated.title}
              className="rounded-lg shadow-md"
            />
            <p className="font-bold text-white">{highestRated.title}</p>
            <p className="text-brand-gold">
              Your rating: {ratings.find(r => r.movie_id === highestRated.id)?.rating ?? '—'}
            </p>
          </div>
        )}
      </section>

      <button
        onClick={copySummary}
        className={`flex items-center gap-2 px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors ${copyFeedback ? 'scale-105' : ''}`}
      >
        <Copy className="h-4 w-4" />
        {copyFeedback ? 'Copied!' : 'Copy Wrapped Summary'}
      </button>
    </div>
  );
}
