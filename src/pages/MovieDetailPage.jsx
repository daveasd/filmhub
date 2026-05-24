import React, { useState, useEffect } from 'react';
import { Star, Clock, Calendar, Film, ArrowLeft, Bookmark, Eye, Play, Sparkles, MessageSquare, AlertTriangle, Trash2, Edit2, ThumbsUp } from 'lucide-react';
import { getMovieDetails, getMovieCredits, getMovieVideos, getSimilarMovies } from '../services/tmdb';
import { MovieDetailSkeleton } from '../components/SkeletonLoader';
import MovieCard from '../components/MovieCard';
import {
  getReviewLikeCount,
  hasUserLikedReview,
  toggleReviewLike,
} from '../utils/reviewLikes';
import { getMovieId } from '../utils/movies';
import { useRating } from '../hooks/useData';

// Placeholder images for missing assets
const PLACEHOLDER_PROFILE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120';
const PLACEHOLDER_POSTER = 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500';

export default function MovieDetailPage({
  movieId,
  onBack,
  onCardClick,
  watchlist,
  watched,
  onWatchlistToggle,
  onWatchedToggle,
  user,
  userReviews,
  onAddReview,
  onDeleteReview,
  onUpdateReview,
  onQuickView,
}) {
  const { rating: personalRating, setRating: setPersonalRating } = useRating(movieId, user);
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState({ cast: [] });
  const [videos, setVideos] = useState({ results: [] });
  const [similar, setSimilar] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review Form States
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Review Sorting
  const [sortOrder, setSortOrder] = useState('newest'); // newest, highest, lowest, liked
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [likeRevision, setLikeRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadMovieData() {
      if (!movieId) return;
      try {
        setLoading(true);
        setError(null);

        const [detailsData, creditsData, videosData, similarData] = await Promise.all([
          getMovieDetails(movieId),
          getMovieCredits(movieId),
          getMovieVideos(movieId),
          getSimilarMovies(movieId)
        ]);

        if (isMounted) {
          setMovie(detailsData);
          setCredits(creditsData);
          setVideos(videosData);
          setSimilar(similarData);
          
          // Reset review form
          setReviewText('');
          setRating(5);
          setIsSpoiler(false);
          setEditingReviewId(null);
        }
      } catch (err) {
        console.error("Error loading movie details:", err);
        if (isMounted) {
          setError("Failed to fetch detailed movie information.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMovieData();

    return () => {
      isMounted = false;
    };
  }, [movieId]);

  if (loading) return <MovieDetailSkeleton />;
  if (error || !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="rounded-lg bg-brand-red/10 border border-brand-red/30 p-6 text-brand-red inline-block mb-4">
          {error || "Movie not found"}
        </div>
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-2 text-white hover:text-brand-gold font-bold">
            <ArrowLeft className="h-5 w-5" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const { id, title, overview, backdrop_path, poster_path, vote_average, release_date, tagline, runtime, genres = [] } = movie;

  const getBackdropUrl = () => {
    if (!backdrop_path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600';
    if (backdrop_path.startsWith('http')) return backdrop_path;
    return `https://image.tmdb.org/t/p/original${backdrop_path}`;
  };

  const getPosterUrl = () => {
    if (!poster_path) return 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=500';
    if (poster_path.startsWith('http')) return poster_path;
    return `https://image.tmdb.org/t/p/w500${poster_path}`;
  };

  const formattedRating = typeof vote_average === 'number' ? vote_average.toFixed(1) : 'N/A';
  const releaseYear = release_date ? new Date(release_date).getFullYear() : 'TBA';

  const inWatchlist = watchlist.some((m) => getMovieId(m) === getMovieId({ id }));
  const inWatched = watched.some((m) => getMovieId(m) === getMovieId({ id }));

  // Trailer key
  const trailer = videos.results?.find(
    (v) => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
  );

  // Filter reviews for this movie
  const filteredReviews = userReviews.filter(
    (r) => (r.movieId ?? r.movie_id) === id,
  );

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortOrder === 'liked') {
      return getReviewLikeCount(b.id) - getReviewLikeCount(a.id);
    }
    if (sortOrder === 'newest') {
      return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    }
    if (sortOrder === 'highest') {
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (sortOrder === 'lowest') {
      return (a.rating ?? 0) - (b.rating ?? 0);
    }
    return 0;
  });

  const handleLikeReview = (reviewId) => {
    toggleReviewLike(reviewId);
    setLikeRevision((n) => n + 1);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    if (editingReviewId) {
      onUpdateReview(editingReviewId, {
        rating,
        content: reviewText,
        isSpoiler,
        timestamp: new Date().toISOString()
      });
      setEditingReviewId(null);
    } else {
      const newReview = {
        id: `r-${Date.now()}`,
        movieId: id,
        movieTitle: title,
        author: user?.username || 'Guest',
        rating,
        content: reviewText,
        isSpoiler,
        timestamp: new Date().toISOString()
      };
      onAddReview(newReview);
    }

    setReviewText('');
    setRating(5);
    setIsSpoiler(false);
  };

  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setReviewText(review.content);
    setRating(review.rating);
    setIsSpoiler(review.isSpoiler);
    // Scroll to form
    document.getElementById('review-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleSpoilerReveal = (reviewId) => {
    setRevealedSpoilers(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  return (
    <div className="bg-dark-bg min-h-screen pb-16 text-left">
      {/* Backdrop Banner */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img
          src={getBackdropUrl()}
          alt={title}
          className="w-full h-full object-cover object-top brightness-[0.3] blur-sm scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1600'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-4 md:left-8 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/10 hover:bg-brand-gold hover:text-black transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Main Info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-28 relative z-10 animate-slide-up-fade">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie Poster */}
          <div className="w-56 md:w-64 shrink-0 mx-auto md:mx-0">
            <img
                  src={getPosterUrl()}
                  alt={title}
                  className="w-full aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-dark-border"
                  onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_POSTER; }}
                />
            
            {/* Quick States Buttons under Poster */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => onWatchlistToggle(movie)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold border transition-colors ${
                  inWatchlist
                    ? 'bg-brand-gold/15 border-brand-gold text-brand-gold hover:bg-brand-gold/25'
                    : 'bg-dark-card border-dark-border text-white hover:border-gray-500 hover:bg-dark-hover'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${inWatchlist ? 'fill-brand-gold' : ''}`} />
                {inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>
              
              <button
                onClick={() => onWatchedToggle(movie)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-bold border transition-colors ${
                  inWatched
                    ? 'bg-brand-red/15 border-brand-red text-brand-red hover:bg-brand-red/25'
                    : 'bg-dark-card border-dark-border text-white hover:border-gray-500 hover:bg-dark-hover'
                }`}
              >
                <Eye className={`h-4 w-4 ${inWatched ? 'fill-brand-red' : ''}`} />
                {inWatched ? 'Watched' : 'Mark Seen'}
              </button>
            </div>

            {/* 1-10 Personal Rating Widget */}
            <div className="glassmorphism mt-6 p-4 rounded-xl text-center space-y-3 shadow-lg border border-white/10 relative group/rating overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/5 to-transparent opacity-0 group-hover/rating:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-brand-gold fill-brand-gold drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
                  Personal Rating
                </span>
                {personalRating !== null && (
                  <button
                    onClick={() => setPersonalRating(null)}
                    className="text-[10px] text-gray-500 hover:text-brand-red font-bold transition-colors uppercase tracking-wider"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isActive = personalRating !== null && num <= personalRating;
                  return (
                    <button
                      key={num}
                      onClick={() => setPersonalRating(num)}
                      className={`flex-1 aspect-square flex items-center justify-center text-[10px] sm:text-xs font-extrabold rounded-lg border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-brand-gold text-black border-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.4)] scale-105 font-black'
                          : 'bg-dark-bg/50 border-dark-border text-gray-400 hover:border-brand-gold/50 hover:text-brand-gold hover:scale-105'
                      }`}
                      title={`Rate ${num}/10`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
              
              {personalRating !== null ? (
                <p className="text-[11px] text-brand-gold font-bold animate-fade-in">
                  You rated this {personalRating}/10
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 italic">
                  Not rated yet. Click a number to rate!
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-grow pt-4 md:pt-28 text-center md:text-left">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-2 text-glow">
              {title}
            </h1>
            {tagline && (
              <p className="text-brand-gold/90 italic text-md md:text-lg mb-4">
                "{tagline}"
              </p>
            )}

            {/* Badges/Stats */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded">
                <Star className="h-4 w-4 fill-brand-gold text-brand-gold" />
                <span className="font-bold">{formattedRating}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{runtime || 'N/A'} min</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{releaseYear}</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-6">
              {genres.map((g) => (
                <span
                  key={g.id}
                  className="rounded-full bg-dark-card border border-dark-border px-3.5 py-1 text-xs font-semibold text-gray-300"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* Overview */}
            <div className="mb-6 max-w-3xl">
              <h3 className="text-lg font-bold text-white mb-2">Synopsis</h3>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                {overview || "No synopsis available."}
              </p>
            </div>
          </div>
        </div>

        {/* Video Trailer */}
        {trailer && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-brand-gold pl-3">
              Official Trailer
            </h3>
            <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden border border-dark-border bg-black shadow-lg">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={`${title} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Cast Members */}
        {credits.cast && credits.cast.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-brand-gold pl-3">
              Principal Cast
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {credits.cast.slice(0, 10).map((actor) => (
                <div key={actor.id} className="min-w-[120px] max-w-[120px] bg-dark-card rounded-lg border border-dark-border overflow-hidden p-1 shrink-0 text-center">
                  <img
                      src={actor.profile_path ? (actor.profile_path.startsWith('http') ? actor.profile_path : `https://image.tmdb.org/t/p/w185${actor.profile_path}`) : PLACEHOLDER_PROFILE}
                      alt={actor.name}
                      className="h-28 w-full object-cover rounded-md mb-2 bg-dark-hover"
                      onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER_PROFILE; }}
                    />
                  <div className="text-xs font-bold text-white truncate px-0.5">{actor.name}</div>
                  <div className="text-[10px] text-gray-500 truncate px-0.5 mt-0.5">{actor.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Write a Review Column */}
          <div className="lg:col-span-1">
            <div id="review-form" className="bg-dark-card border border-dark-border rounded-xl p-5 sticky top-20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-gold" />
                {editingReviewId ? 'Edit Your Review' : 'Add Review'}
              </h3>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Rating selection (1-5 stars) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= rating 
                              ? 'fill-brand-gold text-brand-gold' 
                              : 'text-gray-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Review Content
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts on this film..."
                    className="w-full bg-dark-bg/60 border border-dark-border rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors resize-none"
                  />
                </div>

                {/* Spoiler Toggle */}
                <div className="flex items-center justify-between border-t border-dark-border pt-3">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-300">Contains Spoilers?</span>
                    <span className="text-[10px] text-gray-500">Hides contents behind click cover</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSpoiler} 
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-dark-hover peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-red"></div>
                  </label>
                </div>

                <div className="flex gap-2">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewText('');
                        setRating(5);
                        setIsSpoiler(false);
                      }}
                      className="flex-1 bg-dark-hover hover:bg-dark-hover/80 text-white rounded-lg py-2.5 font-semibold text-xs border border-dark-border transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 bg-brand-gold hover:bg-brand-gold/90 text-black rounded-lg py-2.5 font-bold text-xs transition-colors shadow-md shadow-brand-gold/10"
                  >
                    {editingReviewId ? 'Save Changes' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Reviews List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                User Reviews
                <span className="text-sm font-normal text-gray-500">({sortedReviews.length})</span>
              </h3>
              
              {/* Sort selector */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-dark-card border border-dark-border text-xs rounded-lg text-gray-300 px-3 py-1.5 focus:outline-none focus:border-brand-gold"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="liked">Most Liked</option>
              </select>
            </div>

            {sortedReviews.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-dark-border rounded-xl text-gray-500 px-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm font-medium text-gray-400">
                  No reviews yet. Be the first to review this movie.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedReviews.map((review) => {
                  const isAuthor = review.author === user?.username;
                  const isSpoil = review.isSpoiler || review.is_spoiler;
                  const isRevealed = revealedSpoilers[review.id];
                  const likeCount = getReviewLikeCount(review.id);
                  const userLiked = hasUserLikedReview(review.id);
                  void likeRevision;

                  return (
                    <div key={review.id} className="bg-dark-card/50 border border-dark-border rounded-xl p-5 space-y-3">
                      {/* Review Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center rounded-full text-brand-gold font-bold text-sm">
                            {review.author[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{review.author}</div>
                            <div className="text-[10px] text-gray-500">
                              {new Date(review.timestamp).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`h-3.5 w-3.5 ${
                                idx < review.rating 
                                  ? 'fill-brand-gold text-brand-gold' 
                                  : 'text-gray-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Review Content */}
                      {isSpoil && !isRevealed ? (
                        <div className="relative rounded-lg border border-brand-red/20 bg-brand-red/5 p-4 overflow-hidden">
                          <p className="text-gray-300 text-sm leading-relaxed blur-md select-none pointer-events-none max-h-24 overflow-hidden">
                            {review.content}
                          </p>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-dark-bg/60 backdrop-blur-sm p-4">
                            <AlertTriangle className="h-5 w-5 text-brand-red mb-2" />
                            <p className="text-xs font-bold text-brand-red uppercase tracking-wider mb-1">Spoiler</p>
                            <button
                              type="button"
                              onClick={() => toggleSpoilerReveal(review.id)}
                              className="bg-brand-red hover:bg-brand-red/90 text-white rounded px-4 py-1.5 text-xs font-bold transition-all mt-2"
                            >
                              Click to reveal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line text-left">
                          {review.content}
                          {isSpoil && (
                            <button
                              onClick={() => toggleSpoilerReveal(review.id)}
                              className="block text-[10px] text-brand-red hover:underline mt-2"
                            >
                              Hide Spoiler content
                            </button>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-dark-border/40">
                        <button
                          type="button"
                          onClick={() => handleLikeReview(review.id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                            userLiked ? 'text-brand-gold' : 'text-gray-500 hover:text-brand-gold'
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${userLiked ? 'fill-brand-gold' : ''}`} />
                          {likeCount} {likeCount === 1 ? 'like' : 'likes'}
                        </button>
                      {isAuthor && (
                        <div className="flex gap-3 text-xs">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="flex items-center gap-1 text-gray-400 hover:text-brand-gold transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteReview(review.id)}
                            className="flex items-center gap-1 text-gray-500 hover:text-brand-red transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Similar Movies */}
        {similar.length > 0 && (
          <div className="mt-12 border-t border-dark-border pt-10">
            <h3 className="text-xl font-bold text-white mb-6 border-l-4 border-brand-gold pl-3">
              Similar Movies
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {similar.slice(0, 6).map((simMovie) => (
                <MovieCard
                  key={getMovieId(simMovie)}
                  movie={simMovie}
                  onCardClick={onCardClick}
                  onQuickView={onQuickView}
                  inWatchlist={watchlist.some((m) => getMovieId(m) === getMovieId(simMovie))}
                  inWatched={watched.some((m) => getMovieId(m) === getMovieId(simMovie))}
                  onWatchlistToggle={onWatchlistToggle}
                  onWatchedToggle={onWatchedToggle}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
