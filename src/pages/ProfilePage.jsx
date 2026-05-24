import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bookmark, Eye, Star, Award, ShieldAlert, Mail, Sparkles, Share2, Compass, Loader2 } from 'lucide-react';
import { getProfileBadges, estimateFavoriteGenre, calculateTasteDNA, buildForYouMovies } from '../utils/forYou';
import { getUserRatings } from '../services/dataService';
import { getMovieDetails, getTrendingMovies, getPopularMovies, getTopRatedMovies } from '../services/tmdb';
import MovieCard from '../components/MovieCard';
import { getMovieId } from '../utils/movies';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage({
  user,
  watchlist = [],
  watched = [],
  userReviews = [],
}) {
  const navigate = useNavigate();
  const { profile, updateProfile } = useAuth();
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const currentUserReviews = userReviews.filter((r) => r.author === user?.username);

  // Compute stats from props
  const watchlistCount = watchlist.length;
  const watchedCount = watched.length;
  const reviewsCount = currentUserReviews.length;

  const averageRating = reviewsCount > 0
    ? (currentUserReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : '—';

  // Load and enrich ratings/details
  const [ratings, setRatings] = useState([]);
  const [enrichedWatchlist, setEnrichedWatchlist] = useState([]);
  const [enrichedWatched, setEnrichedWatched] = useState([]);
  const [enrichedRatings, setEnrichedRatings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    getUserRatings(user?.id).then(setRatings);
  }, [user?.id, watchlist, watched]);

  useEffect(() => {
    const fetchAllDetails = async () => {
      setLoadingDetails(true);
      try {
        const uniqueIds = Array.from(new Set([
          ...watchlist.map(m => getMovieId(m)),
          ...watched.map(m => getMovieId(m)),
          ...ratings.map(r => r.movie_id)
        ].filter(Boolean)));
        
        const detailsMap = {};
        await Promise.all(uniqueIds.map(async (id) => {
          try {
            const detail = await getMovieDetails(id);
            if (detail) detailsMap[id] = detail;
          } catch (e) {
            console.error("Failed fetching tmdb detail for", id, e);
          }
        }));

        setEnrichedWatchlist(watchlist.map(m => ({
          ...m,
          genres: detailsMap[getMovieId(m)]?.genres || m.genres || []
        })));
        setEnrichedWatched(watched.map(m => ({
          ...m,
          genres: detailsMap[getMovieId(m)]?.genres || m.genres || []
        })));
        setEnrichedRatings(ratings.map(r => ({
          ...r,
          movie: detailsMap[r.movie_id] || { id: r.movie_id, title: `Movie ${r.movie_id}` }
        })));
      } catch (err) {
        console.error("Enrichment failed", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    
    if (watchlist.length || watched.length || ratings.length) {
      fetchAllDetails();
    } else {
      setEnrichedWatchlist([]);
      setEnrichedWatched([]);
      setEnrichedRatings([]);
    }
  }, [watchlist, watched, ratings]);

  const tasteDNA = calculateTasteDNA(enrichedWatchlist, enrichedWatched, enrichedRatings);
  const totalUniqueMovies = tasteDNA.totalMovies;
  const hasDNA = totalUniqueMovies >= 5;

  useEffect(() => {
    const loadRecs = async () => {
      try {
        const [trending, popular, topRated] = await Promise.all([
          getTrendingMovies(),
          getPopularMovies(),
          getTopRatedMovies(),
        ]);
        const recs = buildForYouMovies({
          watchlist: enrichedWatchlist,
          watched: enrichedWatched,
          userReviews,
          trending,
          popular,
          topRated,
        });
        setRecommendations(recs.slice(0, 3));
      } catch (err) {
        console.error("Failed loading recs", err);
      }
    };
    if (hasDNA) {
      loadRecs();
    }
  }, [enrichedWatchlist, enrichedWatched, userReviews, hasDNA]);

  const handleShare = () => {
    const genreText = tasteDNA.genres
      .map(g => `${g.name} (${g.percentage}%)`)
      .join(', ');
      
    const shareText = `🎬 My FilmHub Taste DNA: ${tasteDNA.title}\n🍿 Library Size: ${tasteDNA.totalMovies} films\n📈 Top Genres: ${genreText}\n✨ "${tasteDNA.explanation}"\nDiscover your Taste DNA at FilmHub!`;
    
    navigator.clipboard.writeText(shareText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const milestoneBadges = getProfileBadges({
    watchlistCount,
    watchedCount,
    reviewsCount,
  });

  // Badges logic
  const getProfileBadge = () => {
    if (user?.isGuest) return 'Guest Filmgoer';
    if (reviewsCount >= 5 && watchedCount >= 5) return 'Cinephile Master';
    if (reviewsCount >= 3) return 'Movie Critic';
    if (watchlistCount >= 5) return 'Curator';
    return 'Film Enthusiast';
  };

  const badgeDescription = () => {
    const badge = getProfileBadge();
    if (badge === 'Guest Filmgoer') return 'Exploring the world of cinema. Log in to track stats permanently!';
    if (badge === 'Cinephile Master') return 'Top tier film historian. You watch, analyze, and write critically.';
    if (badge === 'Movie Critic') return 'Respected reviewer. You help others find the best movies.';
    if (badge === 'Curator') return 'Planning the ultimate watchlist. A true scheduler of screens.';
    return 'Freshly minted collector of fine cinematic moments.';
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 min-h-screen bg-dark-bg text-left animate-slide-up-fade">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2 text-glow">
          <User className="h-7 w-7 text-brand-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          My Profile Dashboard
        </h1>
        <p className="text-gray-300 text-sm mt-1">Manage stats, badge levels, and account details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glassmorphism rounded-2xl p-6 text-center space-y-4">
            {/* Avatar */}
            <div className="mx-auto h-24 w-24 rounded-full bg-brand-gold/10 border-2 border-brand-gold flex items-center justify-center text-brand-gold text-4xl font-extrabold shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              {user ? user.username[0].toUpperCase() : 'G'}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white truncate">{user ? user.username : 'Guest User'}</h2>
              <span className="inline-block mt-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 px-3.5 py-0.5 text-xs font-semibold text-brand-gold">
                {getProfileBadge()}
              </span>
            </div>

            <p className="text-xs text-gray-500 italic max-w-[200px] mx-auto">
              "{badgeDescription()}"
            </p>
          </div>

          {/* Account details */}
          <div className="glassmorphism rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-dark-border/50 pb-2">
              Account Details
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Access Mode:</span>
                <span className="font-bold text-gray-300">{user?.isGuest ? 'Guest Access' : 'Registered Member'}</span>
              </div>
              {!user?.isGuest && user?.email && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email:
                  </span>
                  <span className="font-bold text-gray-300 truncate">{user.email}</span>
                </div>
              )}
            </div>

            {user?.isGuest && (
              <div className="mt-4 rounded-lg bg-brand-red/10 border border-brand-red/20 p-3 flex gap-2">
                <ShieldAlert className="h-4 w-4 text-brand-red shrink-0" />
                <p className="text-[10px] text-gray-400">
                  Guest accounts store watchlist and reviews in browser local storage. Log in for cross-device support.
                </p>
              </div>
            )}
          </div>

          {/* Privacy settings */}
          {!user?.isGuest && (
            <div className="glassmorphism rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-dark-border/50 pb-2">
                Privacy & Sharing
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300 font-semibold">Make my profile public</span>
                <button
                  onClick={async () => {
                    const currentVal = profile?.is_public ?? true;
                    await updateProfile({ is_public: !currentVal });
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    (profile?.is_public ?? true) ? 'bg-violet-600' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      (profile?.is_public ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <p className="text-[10px] text-gray-500 italic leading-normal">
                If public, others can view your FilmHub Taste DNA, stats, and text reviews at `/u/{profile?.username ?? user?.username}`.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => {
                    const username = profile?.username ?? user?.username;
                    if (!username) {
                      alert("Set a username first to share your profile.");
                      return;
                    }
                    const origin = window.location.origin;
                    const link = `${origin}/u/${username}`;
                    navigator.clipboard.writeText(link);
                    setCopyLinkFeedback(true);
                    setTimeout(() => setCopyLinkFeedback(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-dark-card border border-dark-border px-3.5 py-2 text-xs font-bold text-gray-300 hover:border-violet-500/50 hover:text-white transition-all duration-200"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {copyLinkFeedback ? 'Link Copied!' : 'Copy public profile link'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Stat Watchlist */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-brand-gold/30">
              <div className="h-10 w-10 rounded-lg bg-brand-gold/25 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.2)] shrink-0">
                <Bookmark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{watchlistCount}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Watchlist</div>
              </div>
            </div>

            {/* Stat Watched */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(225,29,72,0.15)] hover:border-brand-red/30">
              <div className="h-10 w-10 rounded-lg bg-brand-red/25 flex items-center justify-center text-brand-red shadow-[0_0_10px_rgba(225,29,72,0.2)] shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{watchedCount}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Watched</div>
              </div>
            </div>

            {/* Stat Reviews */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] hover:border-brand-gold/30">
              <div className="h-10 w-10 rounded-lg bg-brand-gold/25 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.2)] shrink-0">
                <Star className="h-5 w-5 fill-brand-gold" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{reviewsCount}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Reviews</div>
              </div>
            </div>

            {/* Stat Avg Review Rating */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:border-white/20">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,255,255,0.15)] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{averageRating}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Avg (Reviews)</div>
              </div>
            </div>

            {/* Stat Ratings Count */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:border-violet-500/30">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)] shrink-0">
                <Star className="h-5 w-5 fill-violet-400 text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{ratings.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Ratings (1-10)</div>
              </div>
            </div>

            {/* Stat Avg Rating 1-10 */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.03] transition-all duration-300 hover:shadow-[0_0_15px_rgba(139,92,246,0.15)] hover:border-violet-500/30">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">
                  {ratings.length > 0 
                    ? (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1) 
                    : '—'}
                </div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Avg (1-10)</div>
              </div>
            </div>
          </div>

          {/* Taste DNA Section */}
          <div className="glassmorphism rounded-2xl p-6 border border-violet-500/20 shadow-[0_0_25px_rgba(139,92,246,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-40 w-40 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-extrabold text-white flex items-center gap-2 text-xl tracking-tight text-glow-purple">
                  <Sparkles className="h-5 w-5 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] animate-pulse" />
                  Your FilmHub Taste DNA
                </h3>
                <p className="text-xs text-gray-400 mt-1">AI-driven analysis of your cinematic blueprint</p>
              </div>
              
              {hasDNA && (
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 px-3.5 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/25 transition-all duration-200"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {copyFeedback ? 'Copied!' : 'Share DNA'}
                </button>
              )}
            </div>

            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin shrink-0" />
                <p className="text-xs italic">Decoding your library DNA...</p>
              </div>
            ) : hasDNA ? (
              <div className="space-y-6">
                {/* Personality Block */}
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-2 relative">
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 inline-block">
                    Cinematic Personality
                  </span>
                  <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-brand-gold tracking-tight">
                    {tasteDNA.title}
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    "{tasteDNA.explanation}"
                  </p>
                </div>

                {/* Genre Distributions */}
                <div className="space-y-3.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                    Genre Blueprint
                  </span>
                  <div className="space-y-3">
                    {tasteDNA.genres.map((g) => (
                      <div key={g.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-300">{g.name}</span>
                          <span className="text-violet-300">{g.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-dark-bg/60 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${g.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-dark-border/40">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Compass className="h-4 w-4 text-violet-400" />
                      Handpicked for Your DNA
                    </span>
                    <div className="grid grid-cols-3 gap-4">
                      {recommendations.map((m) => (
                        <div key={m.id} className="transform hover:scale-[1.03] transition-transform duration-300">
                          <MovieCard
                            movie={m}
                            onCardClick={() => navigate(`/movie/${m.id}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Beautiful empty state */
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4 rounded-xl bg-dark-bg/30 border border-dashed border-dark-border">
                <div className="h-14 w-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="max-w-sm space-y-2">
                  <p className="text-md font-bold text-gray-200">Unlock Your Taste DNA</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Save, watch, and rate at least <span className="font-extrabold text-violet-400">5 movies</span> to decode your movie-watching blueprint, discover your cinematic personality, and unlock personalized recommendations.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2 transition-all duration-200 shadow-[0_0_10px_rgba(139,92,246,0.3)] hover:scale-105 animate-pulse"
                >
                  Explore More Movies
                </button>
              </div>
            )}
          </div>

          <div className="glassmorphism rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-white border-b border-dark-border/50 pb-3 flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-brand-gold" />
              Badges
            </h3>
            <div className="space-y-3">
              {milestoneBadges.map((badge) => (
                <div key={badge.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-bold text-gray-200">{badge.label}</div>
                    <div className="text-xs text-gray-500">{badge.desc}</div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      badge.unlocked
                        ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/30'
                        : 'bg-dark-hover text-gray-500 border border-dark-border'
                    }`}
                  >
                    {badge.unlocked ? 'Unlocked' : badge.progress}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
