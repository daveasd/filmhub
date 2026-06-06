import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Crown,
  Medal,
  Star,
  Eye,
  Bookmark,
  MessageSquare,
  Loader2,
  Users,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getLeaderboardData } from '../services/dataService';
import { ROUTES } from '../lib/routes';

const RANK_STYLES = [
  {
    bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-600/10',
    border: 'border-yellow-500/40',
    glow: 'shadow-[0_0_25px_rgba(234,179,8,0.2)]',
    icon: Crown,
    iconColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/40',
    badgeText: 'text-yellow-300',
    label: '1st',
  },
  {
    bg: 'bg-gradient-to-r from-slate-300/10 to-slate-400/5',
    border: 'border-slate-400/30',
    glow: 'shadow-[0_0_20px_rgba(148,163,184,0.12)]',
    icon: Medal,
    iconColor: 'text-slate-300',
    badgeBg: 'bg-slate-400/15',
    badgeBorder: 'border-slate-400/30',
    badgeText: 'text-slate-300',
    label: '2nd',
  },
  {
    bg: 'bg-gradient-to-r from-amber-700/15 to-orange-600/5',
    border: 'border-amber-700/30',
    glow: 'shadow-[0_0_18px_rgba(180,83,9,0.12)]',
    icon: Medal,
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-700/15',
    badgeBorder: 'border-amber-700/30',
    badgeText: 'text-amber-500',
    label: '3rd',
  },
];

function StatPill({ icon: Icon, value, label, color = 'text-gray-400' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
      <span className="font-bold text-white">{value}</span>
      <span className="text-gray-500 hidden sm:inline">{label}</span>
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('totalActions');

  useEffect(() => {
    setLoading(true);
    getLeaderboardData()
      .then((data) => setLeaders(data ?? []))
      .catch((err) => {
        console.error('Leaderboard fetch error:', err);
        setLeaders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedLeaders = [...leaders].sort((a, b) => {
    if (sortBy === 'totalActions') return b.totalActions - a.totalActions;
    if (sortBy === 'reviewCount') return b.reviewCount - a.reviewCount;
    if (sortBy === 'watchedCount') return b.watchedCount - a.watchedCount;
    if (sortBy === 'ratingCount') return b.ratingCount - a.ratingCount;
    return 0;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 min-h-screen animate-slide-up-fade">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2.5 text-glow">
          <Trophy className="h-7 w-7 text-brand-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
          Leaderboard
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Top film enthusiasts ranked by activity
        </p>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Users className="h-4 w-4 text-violet-400" />
          <span className="text-gray-400 font-semibold">
            {leaders.length} public {leaders.length === 1 ? 'profile' : 'profiles'}
          </span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-dark-card border border-dark-border text-xs rounded-lg text-gray-300 px-3 py-1.5 focus:outline-none focus:border-brand-gold"
        >
          <option value="totalActions">Most Active</option>
          <option value="reviewCount">Most Reviews</option>
          <option value="watchedCount">Most Watched</option>
          <option value="ratingCount">Most Rated</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-3">
          <Loader2 className="h-10 w-10 text-violet-400 animate-spin shrink-0" />
          <p className="text-sm italic">Loading leaderboard...</p>
        </div>
      ) : sortedLeaders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-5">
          <div className="h-16 w-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Sparkles className="h-8 w-8 animate-pulse" />
          </div>
          <div className="max-w-sm space-y-2">
            <p className="text-lg font-bold text-white">No Public Profiles Yet</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              When users make their profiles public, they'll appear here ranked by
              their movie-watching activity. Be the first — toggle "Make my profile
              public" in your Profile settings!
            </p>
          </div>
          <button
            onClick={() => navigate(ROUTES.profile)}
            className="rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm px-6 py-2.5 transition-all duration-200 shadow-md hover:scale-105"
          >
            Go to Profile
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedLeaders.map((user, index) => {
            const rankStyle = RANK_STYLES[index] ?? null;
            const RankIcon = rankStyle?.icon ?? null;
            const rankNumber = index + 1;

            return (
              <div
                key={user.id}
                onClick={() =>
                  user.username
                    ? navigate(ROUTES.publicProfile(user.username))
                    : null
                }
                className={`relative rounded-xl p-4 sm:p-5 border transition-all duration-300 cursor-pointer group hover:scale-[1.01] ${
                  rankStyle
                    ? `${rankStyle.bg} ${rankStyle.border} ${rankStyle.glow}`
                    : 'glassmorphism hover:border-violet-500/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div
                    className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                      rankStyle
                        ? `${rankStyle.badgeBg} border ${rankStyle.badgeBorder} ${rankStyle.badgeText}`
                        : 'bg-dark-card border border-dark-border text-gray-400'
                    }`}
                  >
                    {RankIcon ? (
                      <RankIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${rankStyle.iconColor}`} />
                    ) : (
                      <span className="text-sm sm:text-base">{rankNumber}</span>
                    )}
                  </div>

                  {/* User Avatar + Name */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${
                        index === 0
                          ? 'bg-yellow-500/20 border-2 border-yellow-500/50 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                          : 'bg-brand-gold/10 border border-brand-gold/20 text-brand-gold'
                      }`}
                    >
                      {user.username?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-white truncate group-hover:text-brand-gold transition-colors">
                        {user.username ?? 'Unknown'}
                      </h3>
                      {user.avgReviewRating && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                          <Star className="h-3 w-3 fill-brand-gold text-brand-gold" />
                          <span>Avg review: {user.avgReviewRating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-5">
                    <StatPill
                      icon={Bookmark}
                      value={user.watchlistCount}
                      label="saved"
                      color="text-brand-gold"
                    />
                    <StatPill
                      icon={Eye}
                      value={user.watchedCount}
                      label="watched"
                      color="text-brand-red"
                    />
                    <StatPill
                      icon={MessageSquare}
                      value={user.reviewCount}
                      label="reviews"
                      color="text-violet-400"
                    />
                    <StatPill
                      icon={Star}
                      value={user.ratingCount}
                      label="rated"
                      color="text-violet-400"
                    />
                  </div>

                  {/* Mobile Stats */}
                  <div className="sm:hidden flex flex-col gap-0.5 text-right shrink-0">
                    <span className="text-xs font-black text-white">
                      {user.totalActions}
                    </span>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                      actions
                    </span>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-brand-gold transition-colors shrink-0 hidden sm:block" />
                </div>

                {/* Mobile expanded stats row */}
                <div className="sm:hidden flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <StatPill
                    icon={Bookmark}
                    value={user.watchlistCount}
                    label="saved"
                    color="text-brand-gold"
                  />
                  <StatPill
                    icon={Eye}
                    value={user.watchedCount}
                    label="seen"
                    color="text-brand-red"
                  />
                  <StatPill
                    icon={MessageSquare}
                    value={user.reviewCount}
                    label="reviews"
                    color="text-violet-400"
                  />
                  <StatPill
                    icon={Star}
                    value={user.ratingCount}
                    label="rated"
                    color="text-violet-400"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
