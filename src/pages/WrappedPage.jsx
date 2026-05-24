import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Film,
  Compass,
  Trophy,
  Star,
  Eye,
} from 'lucide-react';
import { calculateTasteDNA, estimateFavoriteGenre } from '../utils/forYou';
import { getUserRatings, getWatchlist, getWatchedMovies } from '../services/dataService';
import { getMovieDetails } from '../services/tmdb';
import { ROUTES } from '../lib/routes';

export default function WrappedPage({ user, watchlist = [], watched = [], userReviews = [] }) {
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highestRated, setHighestRated] = useState(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Load ratings on mount (or when user changes)
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserRatings(user?.id)
      .then(setRatings)
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Compute highest‑rated movie details once ratings are ready
  useEffect(() => {
    if (!ratings?.length) return;
    const best = ratings.reduce((best, cur) => (cur.rating > (best?.rating ?? 0) ? cur : best), null);
    if (best) {
      getMovieDetails(best.movie_id).then(setHighestRated).catch(() => setHighestRated(null));
    }
  }, [ratings]);

  // Stats derived from props and fetched data
  const totalWatched = watched.length;
  const totalSaved = watchlist.length;
  const totalReviews = userReviews.filter(r => r.author === user?.username).length;
  const totalRatings = ratings.length;
  const averageRating = totalRatings ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / totalRatings).toFixed(1) : '—';

  const tasteDNA = calculateTasteDNA(watchlist, watched, ratings);
  const topGenre = tasteDNA.genres[0]?.name ?? 'N/A';
  const topThree = tasteDNA.genres.slice(0, 3).map(g => g.name).join(', ');
  const personality = tasteDNA.title;

  // Card definitions (content is simple JSX, can be expanded)
  const cards = [
    {
      title: 'Your FilmHub Wrapped',
      icon: Sparkles,
      content: (
        <div className="space-y-3 text-center">
          <p className="text-xl font-bold text-white">{personality}</p>
          <p className="text-gray-300">{tasteDNA.explanation}</p>
        </div>
      ),
    },
    {
      title: 'Your Top Genre',
      icon: Compass,
      content: (
        <div className="text-center">
          <p className="text-2xl font-extrabold text-brand-gold">{topGenre}</p>
          <p className="text-gray-400 mt-1">Top 3 Genres: {topThree}</p>
        </div>
      ),
    },
    {
      title: 'Your Movie Personality',
      icon: Trophy,
      content: (
        <div className="text-center">
          <p className="text-2xl font-bold text-violet-400">{personality}</p>
          <p className="text-gray-400 mt-2">{tasteDNA.explanation}</p>
        </div>
      ),
    },
    {
      title: 'Your Highest Rated Movie',
      icon: Star,
      content: highestRated ? (
        <div className="flex flex-col items-center gap-3">
          <img src={`https://image.tmdb.org/t/p/w200${highestRated.poster_path}`} alt={highestRated.title} className="rounded-lg shadow-lg" />
          <p className="font-bold text-white">{highestRated.title}</p>
          <p className="text-brand-gold">Your rating: {ratings.find(r => r.movie_id === highestRated.id)?.rating ?? '—'}</p>
        </div>
      ) : (
        <p className="text-gray-400">No rated movies yet</p>
      ),
    },
    {
      title: 'Your Watchlist Stats',
      icon: Film,
      content: (
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium text-gray-200">Saved movies: {totalSaved}</p>
          <p className="text-lg font-medium text-gray-200">Watched movies: {totalWatched}</p>
          <p className="text-lg font-medium text-gray-200">Reviews: {totalReviews}</p>
          <p className="text-lg font-medium text-gray-200">Ratings: {totalRatings}</p>
        </div>
      ),
    },
    {
      title: 'Your Final Movie Identity',
      icon: Eye,
      content: (
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-red">{personality}</p>
          <p className="text-gray-400 mt-2">You belong to the {topGenre} tribe.</p>
        </div>
      ),
    },
  ];

  const handlePrev = () => setCurrentCard((i) => (i - 1 + cards.length) % cards.length);
  const handleNext = () => setCurrentCard((i) => (i + 1) % cards.length);

  const copySummary = async () => {
    const summary = `My FilmHub Wrapped 🎬\nPersonality: ${personality}\nTop genre: ${topGenre}\nWatched: ${totalWatched} movies\nReviews: ${totalReviews}\nTry FilmHub: https://dawit-filmhub.vercel.app`;
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
        <p className="text-gray-400 max-w-md">Watch, save, rate, and review more movies to unlock your personal cinematic summary.</p>
        <div className="flex gap-4 mt-4">
          <button onClick={() => navigate(ROUTES.search)} className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 font-semibold transition-transform hover:scale-105">
            Explore Movies
          </button>
          <button onClick={() => navigate(ROUTES.ai)} className="rounded-lg bg-brand-gold hover:bg-yellow-500 text-black px-5 py-2.5 font-semibold transition-transform hover:scale-105">
            Ask FilmHub AI
          </button>
          <button onClick={() => navigate(ROUTES.watchlist)} className="rounded-lg bg-dark-card hover:bg-dark-hover border border-dark-border text-gray-300 px-5 py-2.5 font-medium transition-opacity hover:opacity-90">
            Go to Watchlist
          </button>
        </div>
      </div>
    );
  }

  const Current = cards[currentCard];
  const Icon = Current.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 min-h-screen animate-slide-up-fade">
      {/* Card container */}
      <div className="relative rounded-xl glassmorphism p-6 border border-dark-border shadow-lg overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <Icon className="h-6 w-6 text-brand-gold" />
          <h3 className="text-xl font-semibold text-white">{Current.title}</h3>
        </div>
        <div className="text-center transition-opacity duration-300">
          {Current.content}
        </div>
        {/* Navigation */}
        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
          <button onClick={handlePrev} className="pointer-events-auto p-2 rounded-full bg-dark-card/70 hover:bg-dark-hover transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </button>
          <button onClick={handleNext} className="pointer-events-auto p-2 rounded-full bg-dark-card/70 hover:bg-dark-hover transition-colors">
            <ArrowRight className="h-5 w-5 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Copy summary button */}
      <div className="mt-6 flex justify-center">
        <button onClick={copySummary} className={`flex items-center gap-2 rounded-md bg-violet-600 hover:bg-violet-500 text-white font-medium px-4 py-2 transition-colors ${copyFeedback ? 'scale-105' : ''}`}>
          <Copy className="h-4 w-4" />
          {copyFeedback ? 'Copied!' : 'Copy Wrapped Summary'}
        </button>
      </div>

      {/* Taste Card (shareable) */}
      <div className="mt-10 rounded-xl glassmorphism p-5 border border-dark-border bg-dark-card/30">
        <h4 className="text-lg font-bold text-white mb-2">My FilmHub Taste Card</h4>
        <p className="text-gray-300 mb-2">{user?.username ?? 'Guest'} — {personality}</p>
        <p className="text-gray-400 mb-1">Top Genres: {topThree}</p>
        <p className="text-gray-400 mb-1">Watched: {totalWatched} | Reviews: {totalReviews} | Ratings: {totalRatings}</p>
        {user?.isGuest ? null : (
          <p className="text-gray-500 text-sm mt-2">Public profile: <a href={window.location.origin + ROUTES.publicProfile(user.username)} className="underline text-brand-gold">{window.location.origin + ROUTES.publicProfile(user.username)}</a></p>
        )}
        <button onClick={copySummary} className="mt-3 flex items-center gap-2 rounded-md bg-brand-gold hover:bg-yellow-400 text-black font-medium px-3 py-1.5 transition-colors">
          <Copy className="h-3 w-3" />
          Copy Taste Card
        </button>
      </div>
    </div>
  );
}
