/**
 * TMDB movie list helpers — dedupe, validate, normalize ids.
 */

/**
 * Canonical TMDB movie id.
 * Supabase watchlist/watched rows use `id` = row PK and `movie_id` = TMDB id.
 * TMDB API objects use `id` = TMDB id only.
 */
export function getMovieId(movie) {
  if (!movie) return null

  const raw =
    movie.movie_id != null && movie.movie_id !== ''
      ? movie.movie_id
      : movie.id

  if (raw == null || raw === '') return null

  const n = Number(raw)
  return Number.isFinite(n) ? n : raw
}

/** Normalize so `id` and `movie_id` both point at TMDB id (for cards, keys, toggles) */
export function normalizeMovie(movie) {
  if (!movie) return movie
  const tmdbId = getMovieId(movie)
  if (tmdbId == null) return movie
  return { ...movie, id: tmdbId, movie_id: tmdbId }
}

export function hasDisplayableImage(movie) {
  return Boolean(movie?.poster_path || movie?.backdrop_path)
}

/** Safe for general-audience UI: title + image, no adult titles */
export function isValidMovieCard(movie) {
  if (!movie) return false
  if (movie.adult === true) return false
  const title = movie.title?.trim()
  if (!title) return false
  if (!hasDisplayableImage(movie)) return false
  return true
}

/**
 * Remove duplicate movies by TMDB id (keeps first occurrence).
 */
export function uniqueMoviesById(movies, { filterInvalid = true } = {}) {
  if (!Array.isArray(movies)) return []

  const seen = new Set()

  return movies.filter((movie) => {
    const normalized = normalizeMovie(movie)
    if (filterInvalid && !isValidMovieCard(normalized)) return false

    const id = getMovieId(normalized)
    if (id == null || seen.has(id)) return false

    seen.add(id)
    return true
  }).map(normalizeMovie)
}

export function uniqueMoviesByIdLimit(movies, limit) {
  return uniqueMoviesById(movies).slice(0, limit)
}
