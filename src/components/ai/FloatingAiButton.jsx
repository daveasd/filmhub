import React, { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import AiAssistant from './AiAssistant'

export default function FloatingAiButton({
  isGuest,
  isLoggedIn,
  username,
  watchlist,
  watched,
  userReviews,
  onSignInClick,
  hidden = false,
}) {
  const [open, setOpen] = useState(false)

  if (hidden) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-violet-600 text-white font-bold text-sm pl-4 pr-5 py-3.5 shadow-lg shadow-violet-900/40 hover:scale-105 active:scale-95 transition-transform"
        aria-label="Ask FilmHub AI"
      >
        <Sparkles className="h-5 w-5" />
        <span className="hidden sm:inline">Ask FilmHub AI</span>
        <span className="sm:hidden">AI</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full sm:max-w-md max-h-[90vh] flex flex-col bg-dark-card border border-dark-border sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-bg/80">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sparkles className="h-5 w-5 text-brand-gold" />
                FilmHub AI
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <AiAssistant
                compact
                isGuest={isGuest}
                isLoggedIn={isLoggedIn}
                username={username}
                watchlist={watchlist}
                watched={watched}
                userReviews={userReviews}
                onSignInClick={onSignInClick}
                className="border-0 rounded-none h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
