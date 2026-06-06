/**
 * useData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reactive hooks that wrap dataService.js.
 * Each hook takes the current user (from useAuth) and returns data + actions.
 *
 * Usage example:
 *   const { user } = useAuth()
 *   const { items, add, remove, has } = useWatchlist(user)
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getWatchlist,     addToWatchlist,     removeFromWatchlist,
  getWatchedMovies, markAsWatched,      unmarkAsWatched,
  getFavorites,     addToFavorites,     removeFromFavorites,
  getMyReviews,     submitReview,       deleteReview,
  getUserRating,    setUserRating,      deleteUserRating,
  getUserStats,
  getReviewsForMovie,
} from '../services/dataService'

// ─── Watchlist ────────────────────────────────────────────────────────────────

export function useWatchlist(user) {
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const userId = user?.id

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getWatchlist(userId)
    setItems(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (movie) => {
    await addToWatchlist(movie, userId)
    await load()
  }, [userId, load])

  const remove = useCallback(async (movieId) => {
    await removeFromWatchlist(movieId, userId)
    setItems(prev => prev.filter(m => (m.movie_id ?? m.id) !== movieId))
  }, [userId])

  const has = useCallback((movieId) =>
    items.some(m => (m.movie_id ?? m.id) === movieId),
  [items])

  return { items, loading, add, remove, has, refresh: load }
}

// ─── Watched Movies ───────────────────────────────────────────────────────────

export function useWatched(user) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const userId = user?.id

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getWatchedMovies(userId)
    setItems(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const mark = useCallback(async (movie) => {
    await markAsWatched(movie, userId)
    await load()
  }, [userId, load])

  const unmark = useCallback(async (movieId) => {
    await unmarkAsWatched(movieId, userId)
    setItems(prev => prev.filter(m => (m.movie_id ?? m.id) !== movieId))
  }, [userId])

  const has = useCallback((movieId) =>
    items.some(m => (m.movie_id ?? m.id) === movieId),
  [items])

  return { items, loading, mark, unmark, has, refresh: load }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export function useFavorites(user) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const userId = user?.id

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getFavorites(userId)
    setItems(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const add = useCallback(async (movie) => {
    await addToFavorites(movie, userId)
    await load()
  }, [userId, load])

  const remove = useCallback(async (movieId) => {
    await removeFromFavorites(movieId, userId)
    setItems(prev => prev.filter(m => (m.movie_id ?? m.id) !== movieId))
  }, [userId])

  const has = useCallback((movieId) =>
    items.some(m => (m.movie_id ?? m.id) === movieId),
  [items])

  return { items, loading, add, remove, has, refresh: load }
}

// ─── My Reviews ───────────────────────────────────────────────────────────────

export function useMyReviews(user) {
  const [reviews, setReviews]  = useState([])
  const [loading, setLoading]  = useState(true)
  const userId = user?.id

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getMyReviews(userId)
    setReviews(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const submit = useCallback(async (reviewData) => {
    await submitReview(reviewData, user)
    await load()
  }, [user, load])

  const remove = useCallback(async (reviewId) => {
    await deleteReview(reviewId, userId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
  }, [userId])

  return { reviews, loading, submit, remove, refresh: load }
}

// ─── Movie Reviews (for a single movie — public) ──────────────────────────────

export function useMovieReviews(movieId, user) {
  const [reviews, setReviews]  = useState([])
  const [loading, setLoading]  = useState(true)

  const load = useCallback(async () => {
    if (!movieId) return
    setLoading(true)
    const data = await getReviewsForMovie(movieId, user?.id)
    setReviews(data)
    setLoading(false)
  }, [movieId, user?.id])

  useEffect(() => { load() }, [load])

  const submit = useCallback(async (reviewData) => {
    await submitReview({ ...reviewData, movieId }, user)
    await load()
  }, [movieId, user, load])

  const remove = useCallback(async (reviewId) => {
    await deleteReview(reviewId, user?.id)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
  }, [user?.id])

  return { reviews, loading, submit, remove, refresh: load }
}

// ─── Rating for a single movie ────────────────────────────────────────────────

export function useRating(movieId, user) {
  const [rating, setRatingState] = useState(null)
  const userId = user?.id

  useEffect(() => {
    if (!movieId) return
    getUserRating(movieId, userId).then(setRatingState)
  }, [movieId, userId])

  const setRating = useCallback(async (value) => {
    if (value === null) {
      await deleteUserRating(movieId, userId)
      setRatingState(null)
    } else {
      await setUserRating(movieId, value, userId)
      setRatingState(value)
    }
  }, [movieId, userId])

  return { rating, setRating }
}

// ─── User Stats ───────────────────────────────────────────────────────────────

export function useUserStats(user) {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getUserStats(user?.id).then(data => {
      setStats(data)
      setLoading(false)
    })
  }, [user?.id])

  return { stats, loading }
}
