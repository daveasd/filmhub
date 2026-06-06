import React from 'react'
import { Sparkles, Library, Film, Brain } from 'lucide-react'
import AiAssistant from '../components/ai/AiAssistant'

export default function AiRecommendationsPage({
  watchlist = [],
  watched = [],
  userReviews = [],
  favorites = [],
  isGuest = false,
  isLoggedIn = false,
  username = 'Guest',
  onSignInClick,
  onCardClick,
  onWatchlistToggle,
  onWatchedToggle,
}) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 min-h-screen bg-dark-bg text-left">
      <div className="mb-8 animate-slide-up-fade">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-wide flex items-center gap-3 text-glow">
          <Sparkles className="h-8 w-8 text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse" />
          FilmHub AI
        </h1>
        <p className="text-gray-300 text-sm md:text-base mt-2 font-medium">
          Real recommendations powered by Groq — secure, server-side, never
          exposed in the browser
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up-fade" style={{ animationDelay: '100ms' }}>
        <div className="lg:col-span-1 space-y-6">
          <div className="glassmorphism rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-dark-border/50 pb-3 flex items-center gap-2">
              <Library className="h-4 w-4 text-violet-400" />
              Your taste profile
            </h3>

            <div className="space-y-3 text-xs text-gray-400">
              <p>
                FilmHub AI uses this data to personalize answers. Guests use
                local browser storage; signed-in users use synced Supabase data.
              </p>

              <div className="flex justify-between items-center bg-dark-bg/60 p-2.5 rounded border border-dark-border">
                <span className="font-semibold text-gray-300 flex items-center gap-1">
                  <Film className="h-3.5 w-3.5" />
                  Watchlist
                </span>
                <span className="font-bold text-brand-gold">{watchlist.length}</span>
              </div>

              <div className="flex justify-between items-center bg-dark-bg/60 p-2.5 rounded border border-dark-border">
                <span className="font-semibold text-gray-300">Watched</span>
                <span className="font-bold text-brand-red">{watched.length}</span>
              </div>

              <div className="flex justify-between items-center bg-dark-bg/60 p-2.5 rounded border border-dark-border">
                <span className="font-semibold text-gray-300">Reviews</span>
                <span className="font-bold text-violet-400">{userReviews.length}</span>
              </div>
            </div>

            {isGuest && (
              <p className="text-xs text-gray-400 border-t border-dark-border/50 pt-4">
                Sign in for more personalized recommendations based on your full
                history stored in the cloud.
              </p>
            )}
          </div>

          <div className="glassmorphism rounded-xl p-5 text-sm text-gray-300 flex gap-3 items-start">
            <Brain className="h-5 w-5 text-violet-400 shrink-0 mt-0.5 animate-pulse" />
            <span className="leading-relaxed">
              Try: <strong className="text-white">"Something like Inception but easier to follow"</strong> or{' '}
              <strong className="text-white">"Hidden gems from the 90s"</strong>
            </span>
          </div>
        </div>

        <div className="lg:col-span-2">
          <AiAssistant
            isGuest={isGuest}
            isLoggedIn={isLoggedIn}
            username={username}
            watchlist={watchlist}
            watched={watched}
            userReviews={userReviews}
            favorites={favorites}
            onSignInClick={onSignInClick}
            onCardClick={onCardClick}
            onWatchlistToggle={onWatchlistToggle}
            onWatchedToggle={onWatchedToggle}
          />
        </div>
      </div>
    </div>
  )
}
