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

export function calculateTasteDNA(watchlist = [], watched = [], ratings = []) {
  // Aggregate unique movies
  const movieMap = new Map();
  watchlist.forEach(m => movieMap.set(m.movie_id ?? m.id, m));
  watched.forEach(m => movieMap.set(m.movie_id ?? m.id, m));
  ratings.forEach(r => {
    if (r.movie) {
      movieMap.set(r.movie.movie_id ?? r.movie.id, r.movie);
    }
  });

  const uniqueMovies = Array.from(movieMap.values());
  const genreCounts = {};
  let totalGenres = 0;

  uniqueMovies.forEach(m => {
    const genres = m.genres ?? [];
    genres.forEach(g => {
      const name = g.name ?? g;
      if (name) {
        genreCounts[name] = (genreCounts[name] ?? 0) + 1;
        totalGenres++;
      }
    });
  });

  // Sort genres by count
  const sortedGenres = Object.entries(genreCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalGenres > 0 ? Math.round((count / totalGenres) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);

  // Map genre combinations to Personality Titles
  let title = "Eclectic Explorer";
  let explanation = "You appreciate a wide variety of cinematic experiences, refusing to be boxed into a single genre.";

  if (sortedGenres.length > 0) {
    const topGenre = sortedGenres[0].name;
    const secondGenre = sortedGenres[1]?.name;

    if (topGenre === "Science Fiction") {
      if (secondGenre === "Adventure" || secondGenre === "Action") {
        title = "Epic Sci-Fi Voyager";
        explanation = "You love grand journeys through spacetime and spectacular futuristic adventures.";
      } else {
        title = "Mind-Bending Sci-Fi Thinker";
        explanation = "You enjoy complex sci-fi mysteries that challenge your mind and pose big philosophical questions.";
      }
    } else if (topGenre === "Action") {
      if (secondGenre === "Thriller" || secondGenre === "Crime") {
        title = "Gritty Action Strategist";
        explanation = "You prefer high-stakes, realistic crime thrillers and suspenseful showdowns.";
      } else {
        title = "Adrenaline Junkie";
        explanation = "High speed, big explosions, and spectacular stunts are what keep you glued to the screen.";
      }
    } else if (topGenre === "Animation") {
      if (secondGenre === "Family" || secondGenre === "Fantasy") {
        title = "Whimsical Dream Weaver";
        explanation = "You have a love for beautiful animations, magical worlds, and heartwarming family stories.";
      } else {
        title = "Animation Connoisseur";
        explanation = "You appreciate the artistry, technical mastery, and rich storytelling of animated cinema.";
      }
    } else if (topGenre === "Drama") {
      if (secondGenre === "History" || secondGenre === "Biography") {
        title = "Chronicle Historian";
        explanation = "You enjoy rich, emotional dramas based on real historical events and compelling characters.";
      } else {
        title = "Emotional Realist";
        explanation = "You are drawn to intense character studies, powerful emotional themes, and raw human experiences.";
      }
    } else if (topGenre === "Horror") {
      title = "Midnight Thrill Seeker";
      explanation = "You love the dark, atmospheric suspense of horror and thrillers that keep you on the edge of your seat.";
    } else if (topGenre === "Comedy") {
      title = "Joyful Cineaste";
      explanation = "You love witty screenplays, hilarious characters, and lighthearted cinema that leaves you smiling.";
    } else if (topGenre === "Romance") {
      title = "Hopeless Romantic";
      explanation = "You are captivated by deep chemistry, emotional connections, and beautifully woven love stories.";
    } else {
      // Default fallback using top genre name
      title = `${topGenre} Enthusiast`;
      explanation = `Your movie tastes are heavily defined by ${topGenre} films, seeking out their unique narratives and atmospheres.`;
    }
  }

  return {
    title,
    explanation,
    genres: sortedGenres.slice(0, 4), // show top 4 genres
    totalMovies: uniqueMovies.length
  };
}
