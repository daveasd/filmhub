import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  User,
  Bot,
  Lightbulb,
} from 'lucide-react'
import { askFilmHubAi, buildAiContext } from '../../services/aiService.js'

const QUICK_PROMPTS = [
  'What should I watch tonight?',
  'Recommend something like Inception',
  'I feel bored',
  'Give me a 90-minute thriller',
]

export default function AiAssistant({
  isGuest = false,
  isLoggedIn = false,
  username = 'Guest',
  watchlist = [],
  watched = [],
  userReviews = [],
  favorites = [],
  onSignInClick,
  compact = false,
  className = '',
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const tasteCount = watchlist.length + watched.length

  async function sendMessage(text) {
    const question = text?.trim()
    if (!question || loading) return

    setError('')
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const context = buildAiContext({
        isGuest,
        isLoggedIn,
        username,
        watchlist,
        watched,
        userReviews,
        favorites,
      })

      const { reply, source } = await askFilmHubAi({ message: question, context })
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, source },
      ])
    } catch (err) {
      setError(err.message ?? 'Failed to get a response.')
      setMessages((prev) => prev.slice(0, -1))
      setInput(question)
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div
      className={`flex flex-col bg-dark-card border border-dark-border rounded-xl overflow-hidden ${className}`}
    >
      {/* Guest sign-in banner */}
      {isGuest && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-border bg-brand-gold/5 px-4 py-3 text-sm">
          <p className="text-gray-300">
            <Sparkles className="inline h-4 w-4 text-brand-gold mr-1 -mt-0.5" />
            Sign in for more personalized recommendations based on your full
            watchlist, reviews, and favorites synced to your account.
          </p>
          {onSignInClick && (
            <button
              type="button"
              onClick={onSignInClick}
              className="shrink-0 rounded-lg bg-brand-gold/20 border border-brand-gold/40 px-3 py-1.5 text-xs font-semibold text-brand-gold hover:bg-brand-gold/30 transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      )}

      {!isGuest && isLoggedIn && tasteCount > 0 && (
        <div className="border-b border-dark-border bg-violet-500/5 px-4 py-2 text-xs text-gray-400">
          Using your synced taste profile ({watchlist.length} watchlist,{' '}
          {watched.length} watched
          {userReviews.length > 0 ? `, ${userReviews.length} reviews` : ''}).
        </div>
      )}

      {/* Messages */}
      <div
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-4 ${
          compact ? 'min-h-[220px] max-h-[320px]' : 'min-h-[320px] max-h-[480px]'
        }`}
      >
        {messages.length === 0 && !loading && (
          <div className="text-center py-8 px-2">
            <Bot className="h-12 w-12 text-brand-gold/60 mx-auto mb-3" />
            <p className="text-white font-semibold text-sm mb-1">
              Hi! I&apos;m FilmHub AI
            </p>
            <p className="text-gray-500 text-xs max-w-sm mx-auto mb-4">
              Ask me what to watch, mood-based picks, or suggestions based on
              {tasteCount > 0 ? ' your library' : ' genres you love'}.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="text-xs rounded-full border border-dark-border bg-dark-bg/80 px-3 py-1.5 text-gray-400 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-rose-600 to-violet-700 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-brand-gold/15 border border-brand-gold/25 text-gray-100'
                  : 'bg-dark-bg border border-dark-border text-gray-200'
              }`}
            >
              {msg.source === 'fallback' && msg.role === 'assistant' && (
                <p className="text-[10px] text-amber-400/90 mb-2 uppercase tracking-wide font-semibold">
                  Quick pick (Groq busy — offline curator)
                </p>
              )}
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
                <User className="h-4 w-4 text-brand-gold" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-gray-400 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
            FilmHub AI is thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-dark-border p-3 flex gap-2 bg-dark-bg/40"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FilmHub AI: What should I watch?"
          disabled={loading}
          maxLength={2000}
          className="flex-1 rounded-lg bg-dark-bg border border-dark-border text-white placeholder-gray-500 text-sm px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-r from-rose-600 to-violet-600 hover:from-rose-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 transition-all"
          aria-label="Send"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      {!compact && (
        <p className="px-4 pb-3 text-[10px] text-gray-600 flex items-center gap-1">
          <Lightbulb className="h-3 w-3" />
          Powered by Groq via secure Supabase Edge Functions
        </p>
      )}
    </div>
  )
}
