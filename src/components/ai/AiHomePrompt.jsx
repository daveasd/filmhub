import React from 'react'
import { Sparkles, MessageCircle, ArrowRight } from 'lucide-react'

/**
 * Homepage entry point for FilmHub AI (guest + logged-in).
 */
export default function AiHomePrompt({ onOpenAi, onSignInClick, isGuest }) {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-8 mt-2 mb-2">
      <div className="relative overflow-hidden rounded-2xl border border-dark-border bg-gradient-to-r from-dark-card via-violet-950/20 to-dark-card p-5 md:p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-violet-700 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                Ask FilmHub AI: What should I watch?
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold bg-brand-gold/10 border border-brand-gold/30 px-2 py-0.5 rounded-full">
                  New
                </span>
              </h2>
              <p className="text-sm text-gray-400 mt-1 max-w-xl">
                Get real movie picks from FilmHub AI — based on your mood or
                your watchlist. No account required.
                {isGuest && (
                  <span className="text-gray-500">
                    {' '}
                    Sign in for deeper personalization.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAi}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-gold to-brand-gold/90 text-black font-bold text-sm px-5 py-2.5 hover:opacity-95 transition-opacity shadow-lg shadow-brand-gold/10"
            >
              <MessageCircle className="h-4 w-4" />
              Chat with AI
              <ArrowRight className="h-4 w-4" />
            </button>
            {isGuest && onSignInClick && (
              <button
                type="button"
                onClick={onSignInClick}
                className="text-sm text-gray-400 hover:text-brand-gold transition-colors px-2 py-2"
              >
                Sign in for more
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
