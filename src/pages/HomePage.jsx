import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Shuffle, Loader2 } from 'lucide-react';
import Hero from '../components/Hero';
import MovieSlider from '../components/MovieSlider';
import AiHomePrompt from '../components/ai/AiHomePrompt';
import { HeroSkeleton } from '../components/SkeletonLoader';
import { buildForYouMovies } from '../utils/forYou';
import { getMovieId, uniqueMoviesById, uniqueMoviesByIdLimit } from '../utils/movies';
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  discoverByMood,
  MOOD_PRESETS,
} from '../services/tmdb';

const MOOD_KEYS = Object.keys(MOOD_PRESETS);

export default function HomePage({
  onCardClick,
  onQuickView,
  watchlist,
  watched,
  userReviews = [],
  onWatchlistToggle,
  onWatchedToggle,
  onPlayTrailer,
  onOpenAi,
  onSignInClick,
  isGuest,
  onSurpriseMe,
}) {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  const [loadingHero, setLoadingHero] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [error, setError] = useState(null);

  const [activeMood, setActiveMood] = useState(null);
  const [moodMovies, setMoodMovies] = useState([]);
  const [loadingMood, setLoadingMood] = useState(false);
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoadingHero(true);
        setLoadingRows(true);
        setError(null);

        const [trendingData, popularData, topRatedData, nowPlayingData, upcomingData] =
          await Promise.all([
            getTrendingMovies(),
            getPopularMovies(),
            getTopRatedMovies(),
            getNowPlayingMovies(),
            getUpcomingMovies(),
          ]);

        if (isMounted) {
          setTrending(trendingData);
          setPopular(popularData);
          setTopRated(topRatedData);
          setNowPlaying(nowPlayingData);
          setUpcoming(upcomingData);

          if (trendingData.length > 0) {
            setFeaturedMovie(trendingData[0]);
          } else if (popularData.length > 0) {
            setFeaturedMovie(popularData[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load home page movies:', err);
        if (isMounted) {
          setError('Failed to fetch movie listings from TMDB. Please check configuration.');
        }
      } finally {
        if (isMounted) {
          setLoadingHero(false);
          setLoadingRows(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const forYouMovies = useMemo(
    () =>
      uniqueMoviesById(
        buildForYouMovies({
          watchlist,
          watched,
          userReviews,
          trending,
          popular,
          topRated,
        }),
      ),
    [watchlist, watched, userReviews, trending, popular, topRated],
  );

  const handleMoodClick = async (moodKey) => {
    setActiveMood(moodKey);
    setLoadingMood(true);
    try {
      const results = await discoverByMood(moodKey);
      // discoverByMood already dedupes + caps; apply display limit after dedupe
      setMoodMovies(uniqueMoviesById(results).slice(0, 16));
    } catch (e) {
      console.error('Mood discover failed:', e);
      setMoodMovies([]);
    } finally {
      setLoadingMood(false);
    }
  };

  const handleSurprise = async () => {
    setSurpriseLoading(true);
    try {
      const pool = uniqueMoviesByIdLimit(
        topRated.filter((m) => (m.vote_average ?? 0) >= 7),
        50,
      );
      const pick = pool[Math.floor(Math.random() * pool.length)] ?? trending[0];
      if (pick?.id) onSurpriseMe(pick.id);
    } finally {
      setSurpriseLoading(false);
    }
  };

  const isMovieInWatchlist = (movie) =>
    watchlist.some((m) => getMovieId(m) === getMovieId(movie));

  const sliderProps = {
    onCardClick,
    onQuickView,
    watchlist,
    watched,
    onWatchlistToggle,
    onWatchedToggle,
  };

  return (
    <div className="pb-16 bg-dark-bg min-h-screen">
      {loadingHero ? (
        <HeroSkeleton />
      ) : featuredMovie ? (
        <Hero
          movie={featuredMovie}
          inWatchlist={isMovieInWatchlist(featuredMovie)}
          onWatchlistToggle={onWatchlistToggle}
          onPlayTrailer={onPlayTrailer}
        />
      ) : null}

      <AiHomePrompt
        onOpenAi={onOpenAi}
        onSignInClick={onSignInClick}
        isGuest={isGuest}
      />

      {/* Mood + Surprise */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 mt-2 mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-gold" />
            Browse by mood
          </h2>
          <button
            type="button"
            onClick={handleSurprise}
            disabled={surpriseLoading || loadingRows}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-brand-gold/40 bg-brand-gold/10 text-brand-gold font-bold text-sm px-4 py-2.5 hover:bg-brand-gold/20 transition-all disabled:opacity-50 min-h-[44px]"
          >
            {surpriseLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shuffle className="h-4 w-4" />
            )}
            Surprise Me
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {MOOD_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleMoodClick(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all min-h-[40px] ${
                activeMood === key
                  ? 'bg-brand-gold text-black shadow-md shadow-brand-gold/20'
                  : 'bg-dark-card border border-dark-border text-gray-400 hover:border-brand-gold/50 hover:text-brand-gold'
              }`}
            >
              {MOOD_PRESETS[key].label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-4 md:px-8 mt-4">
          <div className="rounded-lg bg-brand-red/10 border border-brand-red/30 p-4 text-sm text-brand-red">
            {error}
          </div>
        </div>
      )}

      <div className="mt-2 space-y-2">
        {activeMood && (
          <MovieSlider
            title={`${MOOD_PRESETS[activeMood].label} Picks`}
            movies={moodMovies}
            loading={loadingMood}
            {...sliderProps}
          />
        )}

        <MovieSlider
          title="For You"
          movies={forYouMovies}
          loading={loadingRows}
          {...sliderProps}
        />

        <MovieSlider title="Trending Today" movies={trending} loading={loadingRows} {...sliderProps} />
        <MovieSlider title="Popular Choices" movies={popular} loading={loadingRows} {...sliderProps} />
        <MovieSlider title="Top Rated Masterpieces" movies={topRated} loading={loadingRows} {...sliderProps} />
        <MovieSlider title="Now Playing in Theaters" movies={nowPlaying} loading={loadingRows} {...sliderProps} />
        <MovieSlider title="Upcoming Releases" movies={upcoming} loading={loadingRows} {...sliderProps} />
      </div>
    </div>
  );
}
