/**
 * dataService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All CRUD for: watchlist, watched_movies, reviews, ratings, favorites
 *
 * Pattern for every function:
 *   • If `userId` is provided  → hit Supabase
 *   • Otherwise               → hit localStorage (guest mode)
 *
 * Call these functions from your components like:
 *   import { addToWatchlist } from '../services/dataService'
 *   await addToWatchlist(movie, user?.id)
 */

import { supabase } from '../lib/supabase.js'

// ─── localStorage helpers ─────────────────────────────────────────────────────

const ls = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key) || '[]') }
    catch { return [] }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)) }
    catch { /* quota exceeded — ignore */ }
  },
}

// Keys used by the existing local implementation — keep them stable so existing
// guest data survives after the upgrade.
const LS_KEYS = {
  watchlist:      'filmhub_watchlist',
  watched:        'filmhub_watched',
  reviews:        'filmhub_reviews',
  ratings:        'filmhub_ratings',
  favorites:      'filmhub_favorites',
  likes:          'filmhub_review_likes',
  comments:       'filmhub_comments',
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST
// ─────────────────────────────────────────────────────────────────────────────

export async function getWatchlist(userId) {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error('getWatchlist:', error)
    return data ?? []
  }
  return ls.get(LS_KEYS.watchlist)
}

export async function addToWatchlist(movie, userId) {
  const row = {
    movie_id:     movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path,
    backdrop_path: movie.backdrop_path ?? null,
    release_date: movie.release_date ?? null,
    vote_average: movie.vote_average ?? null,
    overview:     movie.overview ?? null,
  }

  if (userId && supabase) {
    const { error } = await supabase
      .from('watchlist')
      .insert({ ...row, user_id: userId })
    if (error) console.error('addToWatchlist:', error)
    return !error
  }

  const list = ls.get(LS_KEYS.watchlist)
  if (!list.find(m => m.movie_id === movie.id)) {
    ls.set(LS_KEYS.watchlist, [{ ...row, created_at: new Date().toISOString() }, ...list])
  }
  return true
}

export async function removeFromWatchlist(movieId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    if (error) console.error('removeFromWatchlist:', error)
    return !error
  }

  ls.set(LS_KEYS.watchlist, ls.get(LS_KEYS.watchlist).filter(m => m.movie_id !== movieId))
  return true
}

export async function isInWatchlist(movieId, userId) {
  if (userId && supabase) {
    const { data } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()
    return Boolean(data)
  }
  return ls.get(LS_KEYS.watchlist).some(m => m.movie_id === movieId)
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHED MOVIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getWatchedMovies(userId) {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('watched_movies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error('getWatchedMovies:', error)
    return data ?? []
  }
  return ls.get(LS_KEYS.watched)
}

export async function markAsWatched(movie, userId) {
  const row = {
    movie_id:     movie.id,
    title:        movie.title,
    poster_path:  movie.poster_path,
    backdrop_path: movie.backdrop_path ?? null,
    release_date: movie.release_date ?? null,
    vote_average: movie.vote_average ?? null,
    overview:     movie.overview ?? null,
  }

  if (userId && supabase) {
    // Also remove from watchlist when marking watched
    await supabase.from('watchlist').delete().eq('user_id', userId).eq('movie_id', movie.id)
    const { error } = await supabase
      .from('watched_movies')
      .upsert({ ...row, user_id: userId }, { onConflict: 'user_id,movie_id' })
    if (error) console.error('markAsWatched:', error)
    return !error
  }

  const watched = ls.get(LS_KEYS.watched)
  if (!watched.find(m => m.movie_id === movie.id)) {
    ls.set(LS_KEYS.watched, [{ ...row, created_at: new Date().toISOString() }, ...watched])
  }
  // Also remove from local watchlist
  ls.set(LS_KEYS.watchlist, ls.get(LS_KEYS.watchlist).filter(m => m.movie_id !== movie.id))
  return true
}

export async function unmarkAsWatched(movieId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('watched_movies')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    if (error) console.error('unmarkAsWatched:', error)
    return !error
  }

  ls.set(LS_KEYS.watched, ls.get(LS_KEYS.watched).filter(m => m.movie_id !== movieId))
  return true
}

export async function isWatched(movieId, userId) {
  if (userId && supabase) {
    const { data } = await supabase
      .from('watched_movies')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()
    return Boolean(data)
  }
  return ls.get(LS_KEYS.watched).some(m => m.movie_id === movieId)
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewsForMovie(movieId, userId) {
  if (supabase) {
    // Public reviews visible to everyone; author's own is always shown
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles(username, avatar_url)')
      .eq('movie_id', movieId)
      .order('created_at', { ascending: false })
    if (error) console.error('getReviewsForMovie:', error)
    return data ?? []
  }
  // Guest: return only their own locally stored reviews for this movie
  return ls.get(LS_KEYS.reviews).filter(r => String(r.movie_id) === String(movieId))
}

export async function getMyReviews(userId) {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error('getMyReviews:', error)
    return data ?? []
  }
  return ls.get(LS_KEYS.reviews)
}

export async function submitReview({ movieId, movieTitle, rating, content, isSpoiler = false }, user) {
  const reviewId = user
    ? `${user.id}_${movieId}`
    : `guest_${movieId}_${Date.now()}`

  const row = {
    id:          reviewId,
    movie_id:    movieId,
    movie_title: movieTitle,
    rating,
    content,
    is_spoiler:  isSpoiler,
  }

  if (user && supabase) {
    const { error } = await supabase
      .from('reviews')
      .upsert(
        {
          ...row,
          author_id:  user.id,
          author:     user.user_metadata?.username ?? user.email,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
    if (error) console.error('submitReview:', error)
    return !error
  }

  // Guest: store locally
  const reviews = ls.get(LS_KEYS.reviews).filter(r => r.id !== reviewId)
  ls.set(LS_KEYS.reviews, [{ ...row, author: 'Guest', timestamp: new Date().toISOString() }, ...reviews])
  return true
}

export async function deleteReview(reviewId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('author_id', userId)       // RLS also enforces this
    if (error) console.error('deleteReview:', error)
    return !error
  }

  ls.set(LS_KEYS.reviews, ls.get(LS_KEYS.reviews).filter(r => r.id !== reviewId))
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// RATINGS (numeric, separate from review content)
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserRating(movieId, userId) {
  if (userId && supabase) {
    const { data } = await supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()
    return data?.rating ?? null
  }
  const found = ls.get(LS_KEYS.ratings).find(r => String(r.movie_id) === String(movieId))
  return found?.rating ?? null
}

export async function setUserRating(movieId, rating, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('ratings')
      .upsert({ user_id: userId, movie_id: movieId, rating }, { onConflict: 'user_id,movie_id' })
    if (error) console.error('setUserRating:', error)
    return !error
  }

  const ratings = ls.get(LS_KEYS.ratings).filter(r => String(r.movie_id) !== String(movieId))
  ls.set(LS_KEYS.ratings, [...ratings, { movie_id: movieId, rating }])
  return true
}

export async function deleteUserRating(movieId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('ratings')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    if (error) console.error('deleteUserRating:', error)
    return !error
  }

  ls.set(LS_KEYS.ratings, ls.get(LS_KEYS.ratings).filter(r => String(r.movie_id) !== String(movieId)))
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────────────────────────────────────

export async function getFavorites(userId) {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) console.error('getFavorites:', error)
    return data ?? []
  }
  return ls.get(LS_KEYS.favorites)
}

export async function addToFavorites(movie, userId) {
  const row = {
    movie_id:    movie.id,
    title:       movie.title,
    poster_path: movie.poster_path,
  }

  if (userId && supabase) {
    const { error } = await supabase
      .from('favorites')
      .insert({ ...row, user_id: userId })
    if (error && error.code !== '23505') console.error('addToFavorites:', error) // ignore duplicate
    return !error
  }

  const favs = ls.get(LS_KEYS.favorites)
  if (!favs.find(m => m.movie_id === movie.id)) {
    ls.set(LS_KEYS.favorites, [{ ...row, created_at: new Date().toISOString() }, ...favs])
  }
  return true
}

export async function removeFromFavorites(movieId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('movie_id', movieId)
    if (error) console.error('removeFromFavorites:', error)
    return !error
  }

  ls.set(LS_KEYS.favorites, ls.get(LS_KEYS.favorites).filter(m => m.movie_id !== movieId))
  return true
}

export async function isFavorite(movieId, userId) {
  if (userId && supabase) {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('movie_id', movieId)
      .maybeSingle()
    return Boolean(data)
  }
  return ls.get(LS_KEYS.favorites).some(m => m.movie_id === movieId)
}

// ─────────────────────────────────────────────────────────────────────────────
// USER STATS (derived — used by Profile page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserStats(userId) {
  if (userId && supabase) {
    const [watchlistRes, watchedRes, reviewsRes, ratingsRes, favoritesRes] = await Promise.all([
      supabase.from('watchlist').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('watched_movies').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('reviews').select('rating').eq('author_id', userId),
      supabase.from('ratings').select('movie_id, rating').eq('user_id', userId),
      supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', userId),
    ])

    const reviews   = reviewsRes.data ?? []
    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
      : null

    const ratings   = ratingsRes.data ?? []
    const ratingsCount = ratings.length
    const avgRating10 = ratingsCount
      ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingsCount).toFixed(1)
      : null

    let highestRatedMovieId = null;
    let highestRatingVal = 0;
    ratings.forEach(r => {
      if (r.rating > highestRatingVal) {
        highestRatingVal = r.rating;
        highestRatedMovieId = r.movie_id;
      }
    });

    return {
      watchlistCount:  watchlistRes.count  ?? 0,
      watchedCount:    watchedRes.count    ?? 0,
      reviewCount:     reviews.length,
      avgRating,
      favoritesCount:  favoritesRes.count  ?? 0,
      ratingsCount,
      avgRating10,
      highestRatedMovieId,
      highestRatingVal,
    }
  }

  // Guest stats from localStorage
  const reviews = ls.get(LS_KEYS.reviews)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : null

  const ratings = ls.get(LS_KEYS.ratings)
  const ratingsCount = ratings.length
  const avgRating10 = ratingsCount
    ? (ratings.reduce((s, r) => s + (r.rating ?? 0), 0) / ratingsCount).toFixed(1)
    : null

  let highestRatedMovieId = null;
  let highestRatingVal = 0;
  ratings.forEach(r => {
    if (r.rating > highestRatingVal) {
      highestRatingVal = r.rating;
      highestRatedMovieId = r.movie_id;
    }
  });

  return {
    watchlistCount: ls.get(LS_KEYS.watchlist).length,
    watchedCount:   ls.get(LS_KEYS.watched).length,
    reviewCount:    reviews.length,
    avgRating,
    favoritesCount: ls.get(LS_KEYS.favorites).length,
    ratingsCount,
    avgRating10,
    highestRatedMovieId,
    highestRatingVal,
  }
}

export async function getUserRatings(userId) {
  if (userId && supabase) {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('user_id', userId)
    if (error) console.error('getUserRatings:', error)
    return data ?? []
  }
  return ls.get(LS_KEYS.ratings)
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW LIKES
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewLikesCount(reviewId) {
  if (supabase) {
    const { count, error } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('review_id', reviewId)
    if (error) console.error('getReviewLikesCount:', error)
    return count ?? 0
  }
  const likes = ls.get(LS_KEYS.likes)
  return likes.filter(l => l.review_id === reviewId).length
}

export async function hasUserLikedReview(reviewId, userId) {
  if (userId && supabase) {
    const { data } = await supabase
      .from('review_likes')
      .select('id')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle()
    return Boolean(data)
  }
  const likes = ls.get(LS_KEYS.likes)
  return likes.some(l => l.review_id === reviewId && l.user_id === 'guest')
}

export async function likeReview(reviewId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('review_likes')
      .insert({ review_id: reviewId, user_id: userId })
    if (error && error.code !== '23505') console.error('likeReview:', error)
    return !error
  }
  const likes = ls.get(LS_KEYS.likes)
  if (!likes.some(l => l.review_id === reviewId && l.user_id === 'guest')) {
    ls.set(LS_KEYS.likes, [...likes, { review_id: reviewId, user_id: 'guest', created_at: new Date().toISOString() }])
  }
  return true
}

export async function unlikeReview(reviewId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('review_likes')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', userId)
    if (error) console.error('unlikeReview:', error)
    return !error
  }
  const likes = ls.get(LS_KEYS.likes)
  ls.set(LS_KEYS.likes, likes.filter(l => !(l.review_id === reviewId && l.user_id === 'guest')))
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviewComments(reviewId) {
  if (supabase) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true })
    if (error) console.error('getReviewComments:', error)
    return (data ?? []).map(c => ({
      ...c,
      author: c.profiles?.username ?? 'User',
      avatar_url: c.profiles?.avatar_url
    }))
  }
  const comments = ls.get(LS_KEYS.comments)
  return comments.filter(c => c.review_id === reviewId)
}

export async function addReviewComment(reviewId, content, user) {
  if (user && !user.isGuest && supabase) {
    const { error } = await supabase
      .from('comments')
      .insert({
        review_id: reviewId,
        user_id: user.id,
        content
      })
    if (error) console.error('addReviewComment:', error)
    return !error
  }
  const comments = ls.get(LS_KEYS.comments)
  const newComment = {
    id: Date.now(),
    review_id: reviewId,
    user_id: 'guest',
    author: user?.username ?? 'Guest',
    content,
    created_at: new Date().toISOString()
  }
  ls.set(LS_KEYS.comments, [...comments, newComment])
  return true
}

export async function deleteReviewComment(commentId, userId) {
  if (userId && supabase) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId)
    if (error) console.error('deleteReviewComment:', error)
    return !error
  }
  const comments = ls.get(LS_KEYS.comments)
  ls.set(LS_KEYS.comments, comments.filter(c => c.id !== commentId))
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD & SOCIAL PUBLIC LOOKUPS
// ─────────────────────────────────────────────────────────────────────────────

export async function getLeaderboardData() {
  if (supabase) {
    const { data: rawProfiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
    
    if (profErr) {
      console.error('getLeaderboardData profiles:', profErr)
      return []
    }

    const profiles = rawProfiles ?? []
    if (profiles.length === 0) return []

    const [watchlistRes, watchedRes, reviewsRes, ratingsRes] = await Promise.all([
      supabase.from('watchlist').select('user_id'),
      supabase.from('watched_movies').select('user_id'),
      supabase.from('reviews').select('author_id, rating'),
      supabase.from('ratings').select('user_id, rating')
    ])

    const wl = watchlistRes.data ?? []
    const wm = watchedRes.data ?? []
    const revs = reviewsRes.data ?? []
    const rats = ratingsRes.data ?? []

    return profiles.map(p => {
      const pWl = wl.filter(item => item.user_id === p.id).length
      const pWm = wm.filter(item => item.user_id === p.id).length
      const pRevs = revs.filter(item => item.author_id === p.id).length
      const pRats = rats.filter(item => item.user_id === p.id).length

      const userRevs = revs.filter(item => item.author_id === p.id)
      const avgReviewRating = userRevs.length 
        ? (userRevs.reduce((s, r) => s + (r.rating ?? 0), 0) / userRevs.length).toFixed(1)
        : null

      return {
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        watchlistCount: pWl,
        watchedCount: pWm,
        reviewCount: pRevs,
        ratingCount: pRats,
        avgReviewRating,
        totalActions: pWl + pWm + pRevs + pRats
      }
    })
  }

  const guestReviews = ls.get(LS_KEYS.reviews)
  const guestWl = ls.get(LS_KEYS.watchlist)
  const guestWm = ls.get(LS_KEYS.watched)
  const guestRats = ls.get(LS_KEYS.ratings)
  
  return [
    {
      id: 'guest_id',
      username: 'Guest User',
      avatar_url: null,
      watchlistCount: guestWl.length,
      watchedCount: guestWm.length,
      reviewCount: guestReviews.length,
      ratingCount: guestRats.length,
      avgReviewRating: guestReviews.length ? (guestReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / guestReviews.length).toFixed(1) : null,
      totalActions: guestWl.length + guestWm.length + guestReviews.length + guestRats.length
    }
  ]
}

export async function getPublicProfileByUsername(username) {
  if (!username) return null
  
  if (supabase) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle()

    if (error || !profile) return null

    if (profile.is_public === false) {
      return { profile, isPrivate: true }
    }

    const [watchlistRes, watchedRes, reviewsRes, ratingsRes, favoritesRes] = await Promise.all([
      supabase.from('watchlist').select('*').eq('user_id', profile.id),
      supabase.from('watched_movies').select('*').eq('user_id', profile.id),
      supabase.from('reviews').select('*').eq('author_id', profile.id),
      supabase.from('ratings').select('*').eq('user_id', profile.id),
      supabase.from('favorites').select('*').eq('user_id', profile.id)
    ])

    return {
      profile,
      isPrivate: false,
      watchlist: watchlistRes.data ?? [],
      watched: watchedRes.data ?? [],
      reviews: reviewsRes.data ?? [],
      ratings: ratingsRes.data ?? [],
      favorites: favoritesRes.data ?? []
    }
  }

  if (username.toLowerCase() === 'guest') {
    return {
      profile: { username: 'Guest', avatar_url: null, is_public: true },
      isPrivate: false,
      watchlist: ls.get(LS_KEYS.watchlist),
      watched: ls.get(LS_KEYS.watched),
      reviews: ls.get(LS_KEYS.reviews),
      ratings: ls.get(LS_KEYS.ratings),
      favorites: ls.get(LS_KEYS.favorites)
    }
  }
  return null
}
