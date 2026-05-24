import * as mock from './mockData';
import { uniqueMoviesById } from '../utils/movies';

const cleanResults = (results) => uniqueMoviesById(results ?? []);

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const READ_ACCESS_TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

// Helper to check if TMDB configuration is available
const isConfigured = () => {
  return !!(API_KEY || READ_ACCESS_TOKEN);
};

// Helper to construct headers
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (READ_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${READ_ACCESS_TOKEN}`;
  }
  return headers;
};

// Helper to construct request URL with API Key query param if Bearer token is not used
const getUrl = (endpoint, queryParams = {}) => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // If we don't have read access token but have API key, add it to queries
  if (!READ_ACCESS_TOKEN && API_KEY) {
    url.searchParams.append('api_key', API_KEY);
  }
  
  // Append other queries
  Object.keys(queryParams).forEach(key => {
    if (queryParams[key] !== undefined && queryParams[key] !== null) {
      url.searchParams.append(key, queryParams[key]);
    }
  });
  
  return url.toString();
};

// Generic fetch handler with fallback
const fetchFromTmdb = async (endpoint, queryParams = {}, fallbackFn) => {
  if (!isConfigured()) {
    console.warn(`TMDB API credentials missing. Falling back to mock data for: ${endpoint}`);
    return fallbackFn();
  }

  try {
    const url = getUrl(endpoint, queryParams);
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`TMDB HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`TMDB Fetch failed for ${endpoint}. Falling back to mock data. Error:`, error);
    return fallbackFn();
  }
};

// Exposed TMDB Services
export const getTrendingMovies = async () => {
  const data = await fetchFromTmdb('/trending/movie/day', {}, () => ({
    results: mock.getMockTrendingMovies()
  }));
  return cleanResults(data.results);
};

export const getPopularMovies = async () => {
  const data = await fetchFromTmdb('/movie/popular', {}, () => ({
    results: mock.getMockPopularMovies()
  }));
  return cleanResults(data.results);
};

export const getTopRatedMovies = async () => {
  const data = await fetchFromTmdb('/movie/top_rated', {}, () => ({
    results: mock.getMockTopRatedMovies()
  }));
  return cleanResults(data.results);
};

export const getNowPlayingMovies = async () => {
  const data = await fetchFromTmdb('/movie/now_playing', {}, () => ({
    results: mock.getMockNowPlayingMovies()
  }));
  return cleanResults(data.results);
};

export const getUpcomingMovies = async () => {
  const data = await fetchFromTmdb('/movie/upcoming', {}, () => ({
    results: mock.getMockUpcomingMovies()
  }));
  return cleanResults(data.results);
};

export const searchMovies = async (query) => {
  if (!query || query.trim() === '') {
    return [];
  }
  const data = await fetchFromTmdb('/search/movie', { query }, () => ({
    results: mock.searchMockMovies(query)
  }));
  return cleanResults(data.results);
};

export const getMovieDetails = async (id) => {
  return await fetchFromTmdb(`/movie/${id}`, {}, () => mock.getMockMovieDetails(id));
};

export const getMovieCredits = async (id) => {
  return await fetchFromTmdb(`/movie/${id}/credits`, {}, () => mock.getMockMovieCredits(id));
};

export const getMovieVideos = async (id) => {
  return await fetchFromTmdb(`/movie/${id}/videos`, {}, () => mock.getMockMovieVideos(id));
};

export const getSimilarMovies = async (id) => {
  const data = await fetchFromTmdb(`/movie/${id}/similar`, {}, () => ({
    results: mock.getMockSimilarMovies(id)
  }));
  return cleanResults(data.results);
};

export const getMovieWatchProviders = async (id) => {
  return await fetchFromTmdb(`/movie/${id}/watch/providers`, {}, () => mock.getMockWatchProviders(id));
};

export const TMDB_GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

/** Discover movies by TMDB genre ids and optional filters */
export const discoverMovies = async ({
  genreIds = [],
  sortBy = 'popularity.desc',
  maxRuntime,
  minVoteAverage,
  year,
  language,
  page = 1,
} = {}) => {
  const params = {
    sort_by: sortBy,
    page,
    include_adult: false,
  }
  if (genreIds.length) params.with_genres = genreIds.join(',')
  if (maxRuntime) params['with_runtime.lte'] = maxRuntime
  if (minVoteAverage) params['vote_average.gte'] = minVoteAverage
  if (year) params.primary_release_year = year
  if (language) params.with_original_language = language

  const data = await fetchFromTmdb('/discover/movie', params, () => ({
    results: mock.getMockPopularMovies(),
  }))
  return cleanResults(data.results)
}

/** Mood chip presets → discover params */
export const MOOD_PRESETS = {
  happy: { genreIds: [35], label: 'Happy' },
  sad: { genreIds: [18], label: 'Sad' },
  dark: { genreIds: [27], label: 'Dark' },
  romantic: { genreIds: [10749], label: 'Romantic' },
  action: { genreIds: [28], label: 'Action' },
  mindblowing: { genreIds: [878], label: 'Mind-blowing', minVoteAverage: 7 },
  short: { genreIds: [], label: 'Short', maxRuntime: 100 },
}

const MOOD_FETCH_LIMIT = 24

export const discoverByMood = async (moodKey) => {
  const preset = MOOD_PRESETS[moodKey]
  if (!preset) return []

  let merged = []

  // Dark = horror OR thriller — fetch both, merge, dedupe, then cap
  if (moodKey === 'dark') {
    const [horror, thriller] = await Promise.all([
      discoverMovies({ genreIds: [27], sortBy: 'popularity.desc' }),
      discoverMovies({ genreIds: [53], sortBy: 'popularity.desc' }),
    ])
    merged = [...horror, ...thriller]
  } else {
    merged = await discoverMovies({
      genreIds: preset.genreIds,
      maxRuntime: preset.maxRuntime,
      minVoteAverage: preset.minVoteAverage,
      sortBy: preset.minVoteAverage ? 'vote_average.desc' : 'popularity.desc',
    })
  }

  return uniqueMoviesById(merged).slice(0, MOOD_FETCH_LIMIT)
}
