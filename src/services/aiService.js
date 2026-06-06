/**
 * FilmHub AI — calls Supabase Edge Function (never touches Groq API key).
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

/**
 * @param {object} params
 * @param {string} params.message - User question
 * @param {object} params.context - Taste profile for personalization
 * @returns {Promise<{ reply: string }>}
 */
export async function askFilmHubAi({ message, context = {} }) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'AI is unavailable. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    )
  }

  const { data, error } = await supabase.functions.invoke('filmhub-ai', {
    body: { message, context },
  })

  if (data?.error) {
    throw new Error(data.error)
  }

  if (error) {
    console.error('filmhub-ai invoke error:', error)
    const serverMsg = await readFunctionErrorBody(error)
    if (serverMsg) throw new Error(serverMsg)
    throw new Error(mapInvokeError(error))
  }

  if (!data?.reply) {
    throw new Error('AI returned an empty response. Please try again.')
  }

  return { reply: data.reply, source: data.source ?? 'openai' }
}

async function readFunctionErrorBody(error) {
  try {
    const ctx = error?.context
    if (!ctx) return null
    const parsed =
      typeof ctx.json === 'function'
        ? await ctx.json()
        : typeof ctx.body?.json === 'function'
          ? await ctx.body.json()
          : null
    return parsed?.error ?? null
  } catch {
    return null
  }
}

function mapInvokeError(error) {
  const msg = String(error.message ?? '').toLowerCase()

  if (msg.includes('failed to send') || msg.includes('fetch')) {
    return 'Could not reach the AI service. Check your connection and try again.'
  }
  if (msg.includes('not found') || msg.includes('404')) {
    return 'AI service is not deployed yet. Deploy the filmhub-ai Edge Function in Supabase.'
  }
  if (msg.includes('503') || msg.includes('not configured')) {
    return 'AI service is not configured on the server yet.'
  }

  return 'Something went wrong talking to FilmHub AI. Please try again.'
}

/**
 * Build taste context from app state (guest localStorage or logged-in lists).
 */
export function buildAiContext({
  isGuest = false,
  isLoggedIn = false,
  username = 'Guest',
  watchlist = [],
  watched = [],
  userReviews = [],
  favorites = [],
}) {
  const mapMovies = (list) =>
    list.map((m) => ({
      title: m.title,
      vote_average: m.vote_average ?? null,
    }))

  const mapReviews = (list) =>
    list.map((r) => ({
      movie_title: r.movie_title ?? r.title,
      rating: r.rating,
      content: r.content?.slice?.(0, 120),
    }))

  return {
    isGuest,
    isLoggedIn,
    username,
    watchlist: mapMovies(watchlist),
    watched: mapMovies(watched),
    favorites: mapMovies(favorites),
    reviews: mapReviews(userReviews),
  }
}
