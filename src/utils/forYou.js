/**
 * Build a "For You" row from user taste + TMDB pools.
 */
import { getMovieId, uniqueMoviesById, uniqueMoviesByIdLimit } from './movies'

export function buildForYouMovies({
  watchlist = [],
  watched = [],
  userReviews = [],
  trending = [],
  popular = [],
  topRated = [],
}) {
  const wl = uniqueMoviesById(watchlist)
  const wd = uniqueMoviesById(watched)
  const userMovies = uniqueMoviesById([...wl, ...wd])
  const userIds = new Set(userMovies.map(getMovieId).filter((id) => id != null))

  // Same title often appears in trending + popular + top_rated — merge then dedupe
  const pool = uniqueMoviesById([...trending, ...popular, ...topRated])

  if (userMovies.length === 0) {
    return uniqueMoviesByIdLimit(pool.length ? pool : trending, 12)
  }

  const fromWatchlist = wl.slice(0, 2)
  const pinnedIds = new Set(fromWatchlist.map(getMovieId).filter((id) => id != null))

  const scored = pool
    .filter((m) => {
      const id = getMovieId(m)
      return id != null && !userIds.has(id) && !pinnedIds.has(id)
    })
    .map((m) => {
      let score = (m.vote_average ?? 0) * 10 + (m.popularity ?? 0) * 0.01
      const userGenreOverlap = estimateGenreOverlap(m, userMovies)
      score += userGenreOverlap * 15
      const reviewed = userReviews.some(
        (r) => getMovieId({ id: r.movieId ?? r.movie_id }) === getMovieId(m) &&
          (r.rating ?? 0) >= 7,
      )
      if (reviewed) score += 20
      return { movie: m, score }
    })
    .sort((a, b) => b.score - a.score)

  const picks = scored.slice(0, 10).map((s) => s.movie)

  return uniqueMoviesByIdLimit([...fromWatchlist, ...picks], 12)
}

function estimateGenreOverlap(movie, userMovies) {
  const ids = movie.genre_ids ?? movie.genres?.map((g) => g.id) ?? []
  if (!ids.length) return 0
  let overlap = 0
  for (const um of userMovies) {
    const uids = um.genre_ids ?? um.genres?.map((g) => g.id) ?? []
    overlap += ids.filter((id) => uids.includes(id)).length
  }
  return Math.min(overlap, 5)
}

export function estimateFavoriteGenre(watchlist = [], watched = []) {
  const counts = {}
  for (const m of uniqueMoviesById([...watchlist, ...watched])) {
    const genres = m.genres ?? []
    if (genres.length) {
      genres.forEach((g) => {
        const name = g.name ?? g
        counts[name] = (counts[name] ?? 0) + 1
      })
    }
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? null
}

export function getProfileBadges({ watchlistCount, watchedCount, reviewsCount }) {
  return [
    {
      id: 'first-review',
      label: 'First Review',
      desc: 'Write your first review',
      unlocked: reviewsCount >= 1,
      progress: `${Math.min(reviewsCount, 1)}/1`,
    },
    {
      id: 'explorer',
      label: 'Movie Explorer',
      desc: 'Watch 5 movies',
      unlocked: watchedCount >= 5,
      progress: `${Math.min(watchedCount, 5)}/5`,
    },
    {
      id: 'critic',
      label: 'Critic Mode',
      desc: 'Write 5 reviews',
      unlocked: reviewsCount >= 5,
      progress: `${Math.min(reviewsCount, 5)}/5`,
    },
    {
      id: 'night-owl',
      label: 'Night Owl',
      desc: 'Add 10 movies to watchlist',
      unlocked: watchlistCount >= 10,
      progress: `${Math.min(watchlistCount, 10)}/10`,
    },
  ]
}
