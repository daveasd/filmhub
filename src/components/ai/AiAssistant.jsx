import React, { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Send,
  Loader2,
  AlertCircle,
  User,
  Bot,
  Lightbulb,
  Star,
  Bookmark,
  Eye,
} from 'lucide-react'
import { askFilmHubAi, buildAiContext } from '../../services/aiService.js'
import { searchMovies } from '../../services/tmdb.js'
import { getMovieId } from '../../utils/movies.js'
import { calculateTasteDNA } from '../../utils/forYou.js'

const QUICK_PROMPTS = [
  'Recommend based on my Taste DNA',
  'What should I watch tonight?',
  'Recommend something like Inception',
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
  onCardClick,
  onWatchlistToggle,
  onWatchedToggle,
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

    let userMessageText = question
    let systemAugmentedText = question

    if (question === 'Recommend based on my Taste DNA') {
      if (tasteCount < 5) {
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: question },
          {
            role: 'assistant',
            content: "I'd love to recommend movies based on your Taste DNA! However, your library is a bit light. Please save, watch, or rate at least 5 movies first so I can analyze your unique taste pattern and make premium, personalized recommendations.",
          },
        ])
        return
      }

      // Calculate Taste DNA
      const dna = calculateTasteDNA(watchlist, watched, [])
      userMessageText = 'Recommend movies based on my Taste DNA'
      systemAugmentedText = `Recommend movies based on my Taste DNA. Here is my profile analysis:
Personality Title: ${dna.title}
Top Genres: ${dna.genres.map((g) => `${g.name} (${g.percentage}%)`).join(', ')}
Brief description of my taste: "${dna.explanation}"
Please provide 3 highly customized movie recommendations that perfectly match this Taste DNA!`
    }

    setMessages((prev) => [...prev, { role: 'user', content: userMessageText }])
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

      const { reply, source } = await askFilmHubAi({
        message: systemAugmentedText,
        context,
      })
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
          <div className="text-center py-8 px-2 animate-slide-up-fade">
            <div className="relative mx-auto mb-5 h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-violet-500/40 blur-[20px] animate-pulse" />
              <Bot className="relative h-full w-full text-violet-400 drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]" />
            </div>
            <p className="text-white font-bold text-base mb-1 text-glow">
              Hi! I&apos;m FilmHub AI
            </p>
            <p className="text-gray-400 text-xs max-w-sm mx-auto mb-6">
              Ask me what to watch, mood-based picks, or suggestions based on
              {tasteCount > 0 ? ' your library' : ' genres you love'}.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="glassmorphism text-xs rounded-full px-4 py-2 text-gray-300 hover:border-violet-500/50 hover:text-white hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] hover:scale-105 transition-all duration-300"
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
              <div className="shrink-0 h-8 w-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                <Sparkles className="h-4 w-4 text-violet-400" />
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

              {msg.role === 'assistant' && (
                <AiMessageSuggestions
                  content={msg.content}
                  watchlist={watchlist}
                  watched={watched}
                  onWatchlistToggle={onWatchlistToggle}
                  onWatchedToggle={onWatchedToggle}
                  onCardClick={onCardClick}
                />
              )}
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
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-left">
          <div className="h-7 w-7 bg-rose-500/20 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-500 mb-0.5">AI Error</h4>
            <p className="text-[11px] text-rose-400/90 leading-relaxed">{error}</p>
          </div>
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
          className="flex-1 rounded-lg glassmorphism text-white placeholder-gray-500 text-sm px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="filmhub-btn-glow shrink-0 flex items-center justify-center rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 transition-all"
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

function AiMessageSuggestions({
  content,
  watchlist = [],
  watched = [],
  onWatchlistToggle,
  onWatchedToggle,
  onCardClick,
}) {
  const [suggestedMovies, setSuggestedMovies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Matches words in double asterisks, e.g. **Blade Runner (1982)** or **Inception**
    const regex = /\*\*([^*]+?)\*\*/g
    const matches = []
    let match
    while ((match = regex.exec(content)) !== null) {
      const title = match[1].trim()
      // Remove years in parentheses, e.g. " (2010)" or " (1982)"
      const cleanTitle = title.replace(/\s*\(\d{4}\)$/, '').trim()
      if (cleanTitle && !matches.includes(cleanTitle)) {
        matches.push(cleanTitle)
      }
    }

    if (matches.length === 0) return

    // Limit to 4 to prevent cluttering the chat bubble
    const titlesToFetch = matches.slice(0, 4)

    let isMounted = true
    async function fetchSuggestions() {
      setLoading(true)
      try {
        const fetched = await Promise.all(
          titlesToFetch.map(async (title) => {
            const results = await searchMovies(title)
            if (results && results.length > 0) {
              return results[0]
            }
            return null
          })
        )
        if (isMounted) {
          setSuggestedMovies(fetched.filter(Boolean))
        }
      } catch (err) {
        console.error('AI Assistant suggestion TMDB search error:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSuggestions()

    return () => {
      isMounted = false
    }
  }, [content])

  if (suggestedMovies.length === 0) return null

  return (
    <div className="mt-4 pt-3 border-t border-dark-border/40 text-left">
      <div className="flex items-center gap-1 text-[11px] font-bold text-brand-gold uppercase tracking-wider mb-2">
        <Sparkles className="h-3 w-3" />
        Interactive Quick Picks:
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestedMovies.map((movie) => {
          const movieId = getMovieId(movie)
          const inWatchlist = watchlist.some((m) => getMovieId(m) === movieId)
          const inWatched = watched.some((m) => getMovieId(m) === movieId)
          const posterUrl = movie.poster_path
            ? (movie.poster_path.startsWith('http') ? movie.poster_path : `https://image.tmdb.org/t/p/w92${movie.poster_path}`)
            : 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=200'
          const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'TBA'
          const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : 'N/A'

          return (
            <div
              key={movieId}
              className="flex items-center gap-2 p-2 rounded-xl bg-dark-bg/60 border border-dark-border/60 hover:border-brand-gold/30 hover:bg-dark-bg/90 transition-all duration-200"
            >
              {/* Poster */}
              <div
                className="h-14 w-10 flex-shrink-0 overflow-hidden rounded bg-dark-hover cursor-pointer"
                onClick={() => onCardClick?.(movieId)}
              >
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4
                  className="text-xs font-bold text-white hover:text-brand-gold truncate cursor-pointer"
                  onClick={() => onCardClick?.(movieId)}
                  title={movie.title}
                >
                  {movie.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                  <span>{releaseYear}</span>
                  <span>•</span>
                  <div className="flex items-center gap-0.5 text-brand-gold font-bold">
                    <Star className="h-2.5 w-2.5 fill-brand-gold text-brand-gold" />
                    <span>{rating}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onWatchlistToggle && (
                  <button
                    type="button"
                    onClick={() => onWatchlistToggle(movie)}
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    className={`p-1.5 rounded-lg border transition-all ${
                      inWatchlist
                        ? 'bg-brand-gold border-brand-gold text-black'
                        : 'bg-black/50 border-gray-700 text-gray-400 hover:border-brand-gold hover:text-brand-gold'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                  </button>
                )}
                {onWatchedToggle && (
                  <button
                    type="button"
                    onClick={() => onWatchedToggle(movie)}
                    title={inWatched ? 'Mark as Unwatched' : 'Mark as Watched'}
                    className={`p-1.5 rounded-lg border transition-all ${
                      inWatched
                        ? 'bg-brand-red border-brand-red text-white'
                        : 'bg-black/50 border-gray-700 text-gray-400 hover:border-brand-red hover:text-brand-red'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

