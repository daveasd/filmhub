// FilmHub AI — Supabase Edge Function (Groq only)
// Secret: GROQ_API_KEY (get free key at console.groq.com)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile"
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

interface MovieRef {
  title?: string
  vote_average?: number | null
}

interface ReviewRef {
  movie_title?: string
  title?: string
  rating?: number
  content?: string
}

interface AiContext {
  isGuest?: boolean
  isLoggedIn?: boolean
  username?: string
  watchlist?: MovieRef[]
  watched?: MovieRef[]
  reviews?: ReviewRef[]
  favorites?: MovieRef[]
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function titles(items: MovieRef[] | undefined, limit = 12): string[] {
  if (!items?.length) return []
  return items
    .map((m) => m.title?.trim())
    .filter((t): t is string => Boolean(t))
    .slice(0, limit)
}

function buildSystemPrompt(ctx: AiContext): string {
  const watchlistTitles = titles(ctx.watchlist)
  const watchedTitles = titles(ctx.watched)
  const favoriteTitles = titles(ctx.favorites)
  const reviewLines = (ctx.reviews ?? [])
    .slice(0, 8)
    .map((r) => {
      const name = r.movie_title ?? r.title ?? "Unknown"
      const rating = r.rating != null ? ` (${r.rating}/10)` : ""
      return `- ${name}${rating}`
    })

  const personalization =
    ctx.isLoggedIn && !ctx.isGuest
      ? `The user is signed in as "${ctx.username ?? "member"}". Use their full taste profile below.`
      : ctx.isGuest
        ? `The user is browsing as a guest. Use any local taste data below if present.`
        : `The user is not signed in.`

  return `You are FilmHub AI, a friendly movie curator for FilmHub.

${personalization}

Rules:
- Recommend real films with release years in parentheses.
- Give 3–5 specific picks.
- Be concise (2–4 short paragraphs).
- Never mention API keys, Groq, Supabase, or internal systems.

Taste profile:
- Watchlist: ${watchlistTitles.length ? watchlistTitles.join(", ") : "none"}
- Watched: ${watchedTitles.length ? watchedTitles.join(", ") : "none"}
- Favorites: ${favoriteTitles.length ? favoriteTitles.join(", ") : "none"}
- Reviews: ${reviewLines.length ? reviewLines.join("; ") : "none"}`
}

function buildLocalFallback(userMessage: string, ctx: AiContext): string {
  const wl = titles(ctx.watchlist)
  const wd = titles(ctx.watched)

  const picks = [
    "The Shawshank Redemption (1994)",
    "Inception (2010)",
    "Knives Out (2019)",
    "Mad Max: Fury Road (2015)",
    "The Grand Budapest Hotel (2014)",
  ]

  if (wl.length > 0) {
    return (
      `You asked: “${userMessage}”\n\n` +
      `Based on your watchlist (**${wl.slice(0, 3).join("**, **")}**), try tonight:\n\n` +
      picks.map((p, i) => `${i + 1}. **${p}**`).join("\n") +
      (wd.length ? `\n\nYou've also watched **${wd.slice(0, 2).join("** and **")}**.` : "")
    )
  }

  return (
    `You asked: “${userMessage}”\n\n` +
    `Here are five strong picks:\n\n` +
    picks.map((p, i) => `${i + 1}. **${p}**`).join("\n")
  )
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function groqErrorMessage(status: number, errText: string): string {
  const lower = errText.toLowerCase()
  if (status === 401 || status === 403) {
    return "Invalid Groq API key. Update GROQ_API_KEY in Supabase Edge Function secrets."
  }
  if (status === 429) {
    return "Groq rate limit reached. Wait a minute and try again."
  }
  return `Groq request failed (${status})`
}

async function callGroq(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 1024,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error("Groq API error:", res.status, errText)
    const err = new Error(groqErrorMessage(res.status, errText))
    ;(err as Error & { status: number }).status = res.status
    throw err
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text?.trim()) throw new Error("Empty response from Groq")
  return text.trim()
}

async function callGroqWithRetry(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  try {
    return await callGroq(apiKey, systemPrompt, userMessage)
  } catch (first) {
    const status = (first as Error & { status?: number }).status
    if (status === 429) {
      await sleep(3000)
      return await callGroq(apiKey, systemPrompt, userMessage)
    }
    throw first
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    const groqKey = Deno.env.get("GROQ_API_KEY")?.trim()
    if (!groqKey) {
      return json(
        {
          error:
            "AI not configured. Set GROQ_API_KEY in Supabase secrets (free key at console.groq.com).",
        },
        503,
      )
    }

    let body: { message?: string; context?: AiContext }
    try {
      body = await req.json()
    } catch {
      return json({ error: "Invalid JSON body" }, 400)
    }

    const message = body.message?.trim()
    if (!message) return json({ error: "Please enter a question." }, 400)
    if (message.length > 2000) {
      return json({ error: "Message is too long (max 2000 characters)." }, 400)
    }

    const context: AiContext = body.context ?? {}
    const systemPrompt = buildSystemPrompt(context)

    try {
      const reply = await callGroqWithRetry(groqKey, systemPrompt, message)
      return json({ reply, source: "groq" })
    } catch (groqErr) {
      console.error("Groq failed, using local fallback:", groqErr)
      const reply = buildLocalFallback(message, context)
      return json({ reply, source: "fallback" })
    }
  } catch (err) {
    console.error("filmhub-ai error:", err)
    return json(
      { error: "Could not get a recommendation right now. Please try again." },
      500,
    )
  }
})
