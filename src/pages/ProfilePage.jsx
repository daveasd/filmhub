import React from 'react';
import { User, Bookmark, Eye, Star, Award, ShieldAlert, Mail, Sparkles } from 'lucide-react';
import { getProfileBadges, estimateFavoriteGenre } from '../utils/forYou';

export default function ProfilePage({
  user,
  watchlist = [],
  watched = [],
  userReviews = [],
}) {
  const currentUserReviews = userReviews.filter((r) => r.author === user?.username);

  // Compute stats
  const watchlistCount = watchlist.length;
  const watchedCount = watched.length;
  const reviewsCount = currentUserReviews.length;

  const averageRating = reviewsCount > 0
    ? (currentUserReviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewsCount).toFixed(1)
    : '—';

  const favoriteGenre = estimateFavoriteGenre(watchlist, watched);
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
        </div>

        {/* Stats Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Stat Watchlist */}
            <div className="glassmorphism rounded-xl p-5 flex items-center gap-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:border-brand-gold/30">
              <div className="h-12 w-12 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                <Bookmark className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{watchlistCount}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Watchlist</div>
              </div>
            </div>

            {/* Stat Watched */}
            <div className="glassmorphism rounded-xl p-5 flex items-center gap-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_15px_rgba(225,29,72,0.2)] hover:border-brand-red/30">
              <div className="h-12 w-12 rounded-lg bg-brand-red/20 flex items-center justify-center text-brand-red shadow-[0_0_10px_rgba(225,29,72,0.3)]">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{watchedCount}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Watched</div>
              </div>
            </div>

            {/* Stat Reviews */}
            <div className="glassmorphism rounded-xl p-5 flex items-center gap-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:border-brand-gold/30">
              <div className="h-12 w-12 rounded-lg bg-brand-gold/20 flex items-center justify-center text-brand-gold shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                <Star className="h-6 w-6 fill-brand-gold" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{reviewsCount}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Reviews Written</div>
              </div>
            </div>

            {/* Stat Avg Rating */}
            <div className="glassmorphism rounded-xl p-5 flex items-center gap-4 hover:scale-105 transition-transform duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:border-white/20">
              <div className="h-12 w-12 rounded-lg bg-white/10 flex items-center justify-center text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">{averageRating}</div>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Average Rating</div>
              </div>
            </div>
          </div>

          {favoriteGenre && (
            <div className="glassmorphism !border-violet-500/30 rounded-xl p-5 flex items-center gap-3 shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <Sparkles className="h-6 w-6 text-violet-400 shrink-0 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Favorite genre</p>
                <p className="text-white font-semibold text-lg">{favoriteGenre}</p>
              </div>
            </div>
          )}

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

          {watchlistCount === 0 && watchedCount === 0 && reviewsCount === 0 && (
            <p className="text-sm text-gray-500 text-center px-4">
              Add movies to your watchlist or write a review to unlock stats and badges.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
