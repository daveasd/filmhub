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
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-brand-gold animate-pulse" />
          FilmHub AI
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Real recommendations powered by Groq — secure, server-side, never
          exposed in the browser
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-dark-border pb-2 flex items-center gap-2">
              <Library className="h-4 w-4 text-brand-gold" />
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
              <p className="text-xs text-gray-500 border-t border-dark-border pt-3">
                Sign in for more personalized recommendations based on your full
                history stored in the cloud.
              </p>
            )}
          </div>

          <div className="bg-dark-card/50 border border-dashed border-dark-border rounded-xl p-4 text-xs text-gray-500 flex gap-2">
            <Brain className="h-4 w-4 text-brand-gold shrink-0" />
            <span>
              Try: &quot;Something like Inception but easier to follow&quot; or
              &quot;Hidden gems from the 90s&quot;
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
