import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Bookmark, Eye, Star, Award, ShieldAlert, Sparkles, Compass, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { getPublicProfileByUsername } from '../services/dataService';
import { getMovieDetails } from '../services/tmdb';
import { calculateTasteDNA } from '../utils/forYou';
import { getMovieId } from '../utils/movies';
import MovieCard from '../components/MovieCard';

export default function PublicProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [profile, setProfile] = useState(null);
  
  // Library states
  const [watchlist, setWatchlist] = useState([]);
  const [watched, setWatched] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Enriched list states (for Taste DNA calculation)
  const [enrichedWatchlist, setEnrichedWatchlist] = useState([]);
  const [enrichedWatched, setEnrichedWatched] = useState([]);
  const [enrichedRatings, setEnrichedRatings] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    setIsPrivate(false);

    getPublicProfileByUsername(username).then((data) => {
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(data.profile);
      if (data.isPrivate) {
        setIsPrivate(true);
        setLoading(false);
        return;
      }
      setWatchlist(data.watchlist ?? []);
      setWatched(data.watched ?? []);
      setReviews(data.reviews ?? []);
      setRatings(data.ratings ?? []);
      setFavorites(data.favorites ?? []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setNotFound(true);
      setLoading(false);
    });
  }, [username]);

  // Preload details from TMDB to enrich lists with genres
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

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + (curr.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '—';

  // Badges logic
  const getProfileBadge = () => {
    const reviewsCount = reviews.length;
    const watchedCount = watched.length;
    const watchlistCount = watchlist.length;

    if (reviewsCount >= 5 && watchedCount >= 5) return 'Cinephile Master';
    if (reviewsCount >= 3) return 'Movie Critic';
    if (watchlistCount >= 5) return 'Curator';
    return 'Film Enthusiast';
  };

  const badgeDescription = () => {
    const badge = getProfileBadge();
    if (badge === 'Cinephile Master') return 'Top tier film historian. Watches, analyzes, and writes critically.';
    if (badge === 'Movie Critic') return 'Respected reviewer. Helps others find the best movies.';
    if (badge === 'Curator') return 'Planning the ultimate watchlist. A true scheduler of screens.';
    return 'Freshly minted collector of fine cinematic moments.';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-dark-bg text-gray-400 space-y-3">
        <Loader2 className="h-10 w-10 text-violet-400 animate-spin shrink-0" />
        <p className="text-sm italic">Loading profile details...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-6 min-h-screen flex flex-col justify-center items-center">
        <div className="h-16 w-16 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red shadow-[0_0_20px_rgba(225,29,72,0.3)]">
          <AlertCircle className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Profile Not Found</h1>
          <p className="text-sm text-gray-400">
            The profile for user <span className="text-white font-semibold">"{username}"</span> does not exist or has been removed.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-2.5 transition-all duration-200 shadow-md hover:scale-105"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center space-y-6 min-h-screen flex flex-col justify-center items-center">
        <div className="h-16 w-16 rounded-full bg-gray-500/10 border border-gray-500/20 flex items-center justify-center text-gray-400 shadow-[0_0_20px_rgba(100,116,139,0.2)]">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Private Profile</h1>
          <p className="text-sm text-gray-400">
            This profile is private. The user has chosen to restrict public access to their movie taste and activity.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-dark-card border border-dark-border hover:border-violet-500/50 text-gray-300 hover:text-white font-bold text-sm px-6 py-2.5 transition-all duration-200"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 min-h-screen bg-dark-bg text-left animate-slide-up-fade">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2 text-glow">
          <User className="h-7 w-7 text-brand-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          Public Profile: {profile?.username}
        </h1>
        <p className="text-gray-300 text-sm mt-1">Explore their movie library, ratings, and Taste DNA</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glassmorphism rounded-2xl p-6 text-center space-y-4">
            {/* Avatar */}
            <div className="mx-auto h-24 w-24 rounded-full bg-brand-gold/10 border-2 border-brand-gold flex items-center justify-center text-brand-gold text-4xl font-extrabold shadow-[0_0_20px_rgba(234,179,8,0.4)]">
              {profile?.username ? profile.username[0].toUpperCase() : 'U'}
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-white truncate">{profile?.username}</h2>
              <span className="inline-block mt-1.5 rounded-full bg-brand-gold/10 border border-brand-gold/30 px-3.5 py-0.5 text-xs font-semibold text-brand-gold">
                {getProfileBadge()}
              </span>
            </div>

            <p className="text-xs text-gray-500 italic max-w-[200px] mx-auto">
              "{badgeDescription()}"
            </p>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Stat Watchlist */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
              <div className="h-10 w-10 rounded-lg bg-brand-gold/25 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.2)] shrink-0">
                <Bookmark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{watchlist.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Watchlist</div>
              </div>
            </div>

            {/* Stat Watched */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
              <div className="h-10 w-10 rounded-lg bg-brand-red/25 flex items-center justify-center text-brand-red shadow-[0_0_10px_rgba(225,29,72,0.2)] shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{watched.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Watched</div>
              </div>
            </div>

            {/* Stat Reviews */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
              <div className="h-10 w-10 rounded-lg bg-brand-gold/25 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.2)] shrink-0">
                <Star className="h-5 w-5 fill-brand-gold" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{reviews.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Reviews</div>
              </div>
            </div>

            {/* Stat Avg Review Rating */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,255,255,0.15)] shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{averageRating}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Avg (Reviews)</div>
              </div>
            </div>

            {/* Stat Ratings Count */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
              <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.2)] shrink-0">
                <Star className="h-5 w-5 fill-violet-400 text-violet-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white truncate">{ratings.length}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">Ratings (1-10)</div>
              </div>
            </div>

            {/* Stat Avg Rating 1-10 */}
            <div className="glassmorphism rounded-xl p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
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
          <div className="glassmorphism rounded-2xl p-6 border border-violet-500/20 shadow-[0_0_25px_rgba(139,92,246,0.08)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-extrabold text-white flex items-center gap-2 text-xl tracking-tight text-glow-purple">
                  <Sparkles className="h-5 w-5 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)] animate-pulse" />
                  FilmHub Taste DNA
                </h3>
                <p className="text-xs text-gray-400 mt-1">Cinematic blueprint decoded from library activity</p>
              </div>
            </div>

            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin shrink-0" />
                <p className="text-xs italic">Decoding library DNA...</p>
              </div>
            ) : hasDNA ? (
              <div className="space-y-6">
                {/* Personality Block */}
                <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-2">
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
                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${g.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Beautiful empty state */
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-4 rounded-xl bg-dark-bg/30 border border-dashed border-dark-border">
                <Sparkles className="h-8 w-8 text-gray-600 animate-pulse" />
                <div className="max-w-sm space-y-2">
                  <p className="text-md font-bold text-gray-300">Taste DNA Locked</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This user needs to save, watch, or rate at least 5 movies to unlock their customized Taste DNA mapping.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Top Rated / Favorites list */}
          {favorites.length > 0 && (
            <div className="glassmorphism rounded-2xl p-6 space-y-4">
              <h3 className="font-extrabold text-white flex items-center gap-2 text-lg tracking-tight">
                <Compass className="h-5 w-5 text-brand-gold" />
                Top Favorites
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {favorites.slice(0, 4).map((fav) => {
                  const item = {
                    id: fav.movie_id,
                    movie_id: fav.movie_id,
                    title: fav.title,
                    poster_path: fav.poster_path
                  };
                  return (
                    <div key={fav.id} className="cursor-pointer transform hover:scale-[1.03] transition-transform duration-300" onClick={() => navigate(`/movie/${fav.movie_id}`)}>
                      <MovieCard movie={item} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Public Reviews */}
          {reviews.length > 0 && (
            <div className="glassmorphism rounded-2xl p-6 space-y-4">
              <h3 className="font-extrabold text-white flex items-center gap-2 text-lg tracking-tight">
                <MessageSquare className="h-5 w-5 text-violet-400" />
                Recent Reviews
              </h3>
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-dark-bg/40 border border-dark-border/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white truncate cursor-pointer hover:text-brand-gold" onClick={() => navigate(`/movie/${rev.movie_id}`)}>
                        {rev.movie_title}
                      </h4>
                      <div className="flex items-center gap-0.5 bg-brand-gold/10 text-brand-gold border border-brand-gold/25 px-2 py-0.5 rounded text-xs">
                        <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
                        <span>{rev.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300 leading-normal line-clamp-3">
                      {rev.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
