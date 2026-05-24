import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WrappedPage from './pages/WrappedPage';
import AuthModal from './components/auth/AuthModal';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MovieDetailPage from './pages/MovieDetailPage';
import WatchlistPage from './pages/WatchlistPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './pages/ProfilePage';
import AiRecommendationsPage from './pages/AiRecommendationsPage';
import AboutPage from './pages/AboutPage';
import DeveloperPage from './pages/DeveloperPage';
import ContactPage from './pages/ContactPage';
import ReportPage from './pages/ReportPage';
import FeedbackPage from './pages/FeedbackPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import PublicProfilePage from './pages/PublicProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MOCK_REVIEWS } from './services/mockData';
import { getMovieVideos } from './services/tmdb';
import { supabase } from './lib/supabase';
import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import QuickViewModal from './components/QuickViewModal';
import FloatingAiButton from './components/ai/FloatingAiButton';
import IntroScreen from './components/IntroScreen';
import CursorGlow from './components/CursorGlow';
import { X } from 'lucide-react';
import { getMovieId, normalizeMovie, uniqueMoviesById } from './utils/movies';
import {
  hasIntroBeenSeen,
  markIntroSeen,
  hasGuestSession,
  setGuestSession,
} from './utils/introStorage';
import ScrollToTop from './components/ScrollToTop';
import { ROUTES } from './lib/routes';

function normalizeListItem(item) {
  return normalizeMovie(item);
}

import AdminDashboardPage from './pages/AdminDashboard.jsx';
import { logEvent } from './services/analytics.js';

export default function App() {
  const {
    user: authUser,
    profile,
    isGuest,
    isLoggedIn,
    loading: authLoading,
    continueAsGuest,
  } = useAuth();
  const { toast } = useToast();
  // Basic analytics integration
  useEffect(() => {
    logEvent('page_view', { path: location.pathname }, user?.isGuest ? null : user?.id);
  }, [location.pathname, user]);

  const [showAuth, setShowAuth] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [quickViewMovie, setQuickViewMovie] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Watchlist & watched lists
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);

  // Local reviews state (pre-populated with mock reviews if empty)
  const [userReviews, setUserReviews] = useState(() => {
    const savedReviews = localStorage.getItem('filmhub_reviews');
    if (savedReviews) {
      return JSON.parse(savedReviews);
    }
    localStorage.setItem('filmhub_reviews', JSON.stringify(MOCK_REVIEWS));
    return MOCK_REVIEWS;
  });

  // Trailer video popup modal state
  const [activeTrailerUrl, setActiveTrailerUrl] = useState(null);

  // Track whether initial data load is done (prevents overwriting localStorage on mount)
  const [dataLoaded, setDataLoaded] = useState(false);

  // Decide intro vs auth gate after session loads
  useEffect(() => {
    if (authLoading) return;

    if (isLoggedIn) {
      markIntroSeen();
      setShowIntro(false);
      setIntroReady(true);
      return;
    }

    if (hasIntroBeenSeen()) {
      setShowIntro(false);
      setIntroReady(true);
      if (hasGuestSession() && !isGuest) {
        continueAsGuest();
      }
      return;
    }

    setShowIntro(true);
    setIntroReady(true);
  }, [authLoading, isLoggedIn, isGuest, continueAsGuest]);

  // Auth modal only after intro is dismissed (not for first-time visitors on intro)
  useEffect(() => {
    if (!introReady || authLoading || showIntro) return;
    if (!isLoggedIn && !isGuest) {
      setShowAuth(true);
    }
  }, [introReady, authLoading, showIntro, isLoggedIn, isGuest]);

  const finishIntro = () => {
    markIntroSeen();
    setShowIntro(false);
  };

  const handleIntroLogin = () => {
    finishIntro();
    setShowAuth(true);
  };

  const handleIntroGuest = () => {
    finishIntro();
    setGuestSession();
    continueAsGuest();
  };

  const handleIntroSkip = () => {
    finishIntro();
    setShowAuth(true);
  };

  // Sync app user from AuthContext (Supabase session or guest)
  useEffect(() => {
    if (authLoading) return;
    if (isGuest) {
      setUser({ username: 'Guest', isGuest: true });
      return;
    }
    if (isLoggedIn && authUser) {
      setUser({
        id: authUser.id,
        username:
          profile?.username ??
          authUser.user_metadata?.username ??
          authUser.email?.split('@')[0] ??
          'User',
        email: authUser.email,
        isGuest: false,
      });
      return;
    }
    setUser(null);
  }, [authLoading, isGuest, isLoggedIn, authUser, profile]);

  // Load user data: Supabase for logged-in users, localStorage for guests
  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setWatched([]);
      setDataLoaded(false);
      return;
    }

    const loadData = async () => {
      if (!user.isGuest && supabase) {
        // Logged-in user: load from Supabase
        try {
          const { data: wl } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', user.id);
          if (wl) setWatchlist(uniqueMoviesById(wl.map(normalizeListItem)));

          const { data: wm } = await supabase
            .from('watched_movies')
            .select('*')
            .eq('user_id', user.id);
          if (wm) setWatched(uniqueMoviesById(wm.map(normalizeListItem)));

          const { data: rev } = await supabase
            .from('reviews')
            .select('*')
            .eq('author_id', user.id);
          if (rev) setUserReviews(rev);
        } catch (err) {
          console.error('Failed to load data from Supabase:', err);
        }
      } else {
        // Guest: load from localStorage
        const savedWatchlist = JSON.parse(localStorage.getItem('filmhub_watchlist') || '[]');
        setWatchlist(uniqueMoviesById(savedWatchlist.map(normalizeListItem)));
        const savedWatched = JSON.parse(localStorage.getItem('filmhub_watched_guest') || '[]');
        setWatched(uniqueMoviesById(savedWatched.map(normalizeListItem)));
        const savedReviews = JSON.parse(localStorage.getItem('filmhub_reviews') || '[]');
        if (savedReviews.length > 0) setUserReviews(savedReviews);
      }
      setDataLoaded(true);
    };

    loadData();
  }, [user]);

  // Persist guest data to localStorage whenever state changes (only after initial load)
  useEffect(() => {
    if (!user || !user.isGuest || !dataLoaded) return;
    localStorage.setItem('filmhub_watchlist', JSON.stringify(watchlist));
    localStorage.setItem('filmhub_watched_guest', JSON.stringify(watched));
    localStorage.setItem('filmhub_reviews', JSON.stringify(userReviews));
  }, [watchlist, watched, userReviews, user, dataLoaded]);

  const handleQuickView = (movie) => {
    setQuickViewMovie(movie);
  };

  // Movie watchlist toggle
  const handleWatchlistToggle = (movie) => {
    const movieId = getMovieId(movie);
    setWatchlist((prev) => {
      const exists = prev.some((m) => getMovieId(m) === movieId);
      let newList;
      if (exists) {
        newList = prev.filter((m) => getMovieId(m) !== movieId);
      } else {
        const minimal = normalizeMovie({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          overview: movie.overview,
        });
        newList = uniqueMoviesById([...prev, minimal]);
      }

      // Sync to Supabase for logged-in users
      if (user && !user.isGuest && supabase) {
        (async () => {
          try {
            if (exists) {
              await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movie.id);
            } else {
              await supabase.from('watchlist').insert({
                user_id: user.id,
                movie_id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                overview: movie.overview,
              });
            }
          } catch (e) {
            console.error('Supabase watchlist error:', e);
          }
        })();
      }

      if (!exists) toast('Added to watchlist');
      else toast('Removed from watchlist', 'info');

      return newList;
    });
  };

  // Movie watched toggle
  const handleWatchedToggle = (movie) => {
    const movieId = getMovieId(movie);
    setWatched((prev) => {
      const exists = prev.some((m) => getMovieId(m) === movieId);
      let newList;
      if (exists) {
        newList = prev.filter((m) => getMovieId(m) !== movieId);
      } else {
        newList = [...prev, normalizeMovie(movie)];
        // Remove from watchlist when marking as watched
        setWatchlist((wl) => wl.filter((m) => getMovieId(m) !== movieId));
      }

      // Sync to Supabase for logged-in users
      if (user && !user.isGuest && supabase) {
        (async () => {
          try {
            if (exists) {
              await supabase.from('watched_movies').delete().eq('user_id', user.id).eq('movie_id', movie.id);
            } else {
              await supabase.from('watched_movies').insert({
                user_id: user.id,
                movie_id: movie.id,
                title: movie.title,
                poster_path: movie.poster_path,
                backdrop_path: movie.backdrop_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
                overview: movie.overview,
              });
              // Also remove from watchlist in Supabase
              await supabase.from('watchlist').delete().eq('user_id', user.id).eq('movie_id', movie.id);
            }
          } catch (e) {
            console.error('Supabase watched error:', e);
          }
        })();
      }

      if (!exists) toast('Marked as watched');
      else toast('Removed from watched', 'info');

      return newList;
    });
  };

  // Review Operations
  const handleAddReview = async (newReview) => {
    setUserReviews((prev) => [newReview, ...prev]);
    toast('Review added');
    if (user && !user.isGuest && supabase) {
      const { error } = await supabase.from('reviews').insert({
        author_id: user.id,
        author: user.username,
        ...newReview,
      });
      if (error) console.error('Supabase review insert error:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setUserReviews((prev) => prev.filter((r) => r.id !== reviewId));
    if (user && !user.isGuest && supabase) {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('author_id', user.id);
      if (error) console.error('Supabase review delete error:', error);
    }
  };

  const handleUpdateReview = async (reviewId, updatedFields) => {
    setUserReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updatedFields } : r))
    );
    if (user && !user.isGuest && supabase) {
      const { error } = await supabase
        .from('reviews')
        .update(updatedFields)
        .eq('id', reviewId)
        .eq('author_id', user.id);
      if (error) console.error('Supabase review update error:', error);
    }
  };

  // Launch trailer modal from movie ID
  const handlePlayTrailer = async (movieId) => {
    try {
      const videoData = await getMovieVideos(movieId);
      const trailer = videoData.results?.find(
        (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
      );
      if (trailer) {
        setActiveTrailerUrl(`https://www.youtube.com/embed/${trailer.key}`);
      } else {
        alert("Official trailer is not available for this title.");
      }
    } catch (err) {
      console.error("Failed to load trailer URL:", err);
    }
  };

  const handleCardClick = (movieId) => {
    navigate(ROUTES.movie(movieId));
  };

  const handleSurpriseMe = (movieId) => {
    navigate(ROUTES.movie(movieId));
    toast('Surprise pick — enjoy!', 'info');
  };

  const sharedMovieProps = {
    onCardClick: handleCardClick,
    onQuickView: handleQuickView,
    watchlist,
    watched,
    onWatchlistToggle: handleWatchlistToggle,
    onWatchedToggle: handleWatchedToggle,
  };

  const movieDetailProps = {
    onCardClick: handleCardClick,
    watchlist,
    watched,
    onWatchlistToggle: handleWatchlistToggle,
    onWatchedToggle: handleWatchedToggle,
    user,
    userReviews,
    onAddReview: handleAddReview,
    onDeleteReview: handleDeleteReview,
    onUpdateReview: handleUpdateReview,
    onQuickView: handleQuickView,
  };

  function MovieDetailRoute() {
    const { movieId } = useParams();
    return (
      <MovieDetailPage
        movieId={movieId}
        onBack={() => navigate(-1)}
        {...movieDetailProps}
      />
    );
  }

  if (authLoading || !introReady) {
    return (
      <div className="fixed inset-0 bg-[#060608] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (showIntro) {
    return (
      <>
        <CursorGlow />
        <IntroScreen
          onLogin={handleIntroLogin}
          onGuest={handleIntroGuest}
          onSkip={handleIntroSkip}
        />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <CursorGlow />
        <div className="fixed inset-0 bg-[#060608]" />
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-brand-gold/30">
          <ScrollToTop />
          {/* Global Auth Modal Container */}
          <div className="relative z-50">
            <Navbar onOpenAuth={() => setShowAuth(true)} />
            <main className="flex-grow overflow-x-hidden">
              <div key={location.pathname} className="animate-slide-up-fade">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <HomePage
                        {...sharedMovieProps}
                        userReviews={userReviews}
                        onPlayTrailer={handlePlayTrailer}
                        onOpenAi={() => navigate(ROUTES.ai)}
                        onSignInClick={() => setShowAuth(true)}
                        isGuest={Boolean(user?.isGuest)}
                        onSurpriseMe={handleSurpriseMe}
                      />
                    }
                  />
                  <Route path="/search" element={<SearchPage {...sharedMovieProps} />} />
                  <Route
                    path="/watchlist"
                    element={
                      <WatchlistPage
                        {...sharedMovieProps}
                        onExplore={() => navigate(ROUTES.search)}
                      />
                    }
                  />
                  <Route
                    path="/reviews"
                    element={
                      <ReviewsPage
                        userReviews={userReviews}
                        onDeleteReview={handleDeleteReview}
                        onCardClick={handleCardClick}
                        user={user}
                      />
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProfilePage
                        user={user}
                        watchlist={watchlist}
                        watched={watched}
                        userReviews={userReviews}
                      />
                    }
                  />
                  <Route
                    path="/ai"
                    element={
                      <AiRecommendationsPage
                        watchlist={watchlist}
                        watched={watched}
                        userReviews={userReviews}
                        isGuest={Boolean(user?.isGuest)}
                        isLoggedIn={Boolean(user && !user.isGuest)}
                        username={user?.username ?? profile?.username ?? 'Guest'}
                        onSignInClick={() => setShowAuth(true)}
                        onCardClick={handleCardClick}
                        onWatchlistToggle={handleWatchlistToggle}
                        onWatchedToggle={handleWatchedToggle}
                      />
                    }
                  />
                  <Route path="/wrapped" element={<WrappedPage user={user} watchlist={watchlist} watched={watched} userReviews={userReviews} />} />
                  <Route path="/movie/:movieId" element={<MovieDetailRoute />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/developer" element={<DeveloperPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/report" element={<ReportPage user={user} />} />
                  <Route path="/feedback" element={<FeedbackPage user={user} />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/u/:username" element={<PublicProfilePage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route
                    path="*"
                    element={
                      <div className="text-white py-20 text-center">Page under construction</div>
                    }
                  />
                </Routes>
              </div>
            </main>
            <Footer />
          </div>
          <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
          <FloatingAiButton
            hidden={location.pathname === ROUTES.ai}
            isGuest={Boolean(user?.isGuest)}
            isLoggedIn={Boolean(user && !user.isGuest)}
            username={user?.username ?? profile?.username ?? 'Guest'}
            watchlist={watchlist}
            watched={watched}
            userReviews={userReviews}
            onSignInClick={() => setShowAuth(true)}
            onCardClick={handleCardClick}
            onWatchlistToggle={handleWatchlistToggle}
            onWatchedToggle={handleWatchedToggle}
          />
          {quickViewMovie && (
            <QuickViewModal
              movie={quickViewMovie}
              onClose={() => setQuickViewMovie(null)}
              onViewDetails={handleCardClick}
              inWatchlist={watchlist.some((m) => getMovieId(m) === getMovieId(quickViewMovie))}
              inWatched={watched.some((m) => getMovieId(m) === getMovieId(quickViewMovie))}
              onWatchlistToggle={handleWatchlistToggle}
              onWatchedToggle={handleWatchedToggle}
            />
          )}
          {activeTrailerUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
              <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden border border-brand-gold/30 bg-black shadow-2xl">
                <button
                  onClick={() => setActiveTrailerUrl(null)}
                  className="absolute top-4 right-4 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-brand-red hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="aspect-video w-full">
                  <iframe
                    src={activeTrailerUrl}
                    title="Trailer Player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}
      </div>
    </ErrorBoundary>
  );
}
