# FilmHub — Dawit's FilmHub Review

A modern, dark-themed movie discovery and tracking platform. Browse real TMDB data, manage watchlists, write reviews, get Groq-powered AI recommendations, and explore as a guest or signed-in user.

**Live stack:** React 19 · Vite 8 · Tailwind CSS v4 · TMDB · Supabase · Groq (Edge Functions)

---

## Features

- **Cinematic intro** — animated welcome screen before login/guest
- **Auth** — Supabase sign up / sign in, or continue as guest
- **Home** — trending rows, mood chips (Action, Mind-blowing, etc.), For You recommendations, Surprise Me
- **Search** — debounced TMDB search
- **Movie detail** — posters, cast, trailers, reviews, similar movies
- **Watchlist & watched** — synced to Supabase when logged in; localStorage for guests
- **Reviews** — ratings, spoiler blur, likes, sorting
- **AI Recs** — Groq via secure `filmhub-ai` Supabase Edge Function (no client API keys)
- **Profile** — stats, badges, favorite genre estimate
- **Portfolio pages** — About, Developer, Contact, Report, Feedback, Privacy, Terms
- **Responsive UI** — mobile-friendly navbar, sliders, and forms

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Icons | Lucide React |
| Movies | [TMDB API](https://www.themoviedb.org/documentation/api) |
| Backend | [Supabase](https://supabase.com) (Auth, Postgres, RLS) |
| AI | Groq via Supabase Edge Function `filmhub-ai` |
| Deploy | [Vercel](https://vercel.com) (static SPA) |

---

## Environment variables

### Vercel / local frontend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TMDB_API_KEY` | One of TMDB pair | TMDB API key (query param auth) |
| `VITE_TMDB_READ_ACCESS_TOKEN` | One of TMDB pair | TMDB v4 read access token (Bearer auth) |
| `VITE_SUPABASE_URL` | Yes* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes* | Supabase **anon** public key only |

\*Without Supabase, the app falls back to guest-only local mode and mock TMDB data if keys are missing.

### Supabase Edge Function secrets (never in frontend)

| Secret | Required | Description |
|--------|----------|-------------|
| `GROQ_API_KEY` | For AI | From [console.groq.com](https://console.groq.com) |
| `GROQ_MODEL` | Optional | Default: `llama-3.3-70b-versatile` |

**Do not** add `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or any secret to `VITE_*` variables.

---

## Local setup

```bash
# 1. Install
npm install

# 2. Environment
cp .env.example .env
# Edit .env with your TMDB + Supabase keys

# 3. Dev server
npm.cmd run dev
# → http://localhost:5173
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run SQL from `supabase_schema.sql` (and `supabase_fix_signup.sql` if needed) in the SQL Editor.
3. Copy **Project URL** and **anon public** key into `.env`.
4. Enable Email auth (or your preferred providers) under Authentication.

### AI setup

1. Get a Groq API key at [console.groq.com](https://console.groq.com).
2. In Supabase: **Edge Functions → Secrets** → add `GROQ_API_KEY`.
3. Deploy the function:

```bash
npx.cmd supabase login
npx.cmd supabase link --project-ref YOUR_PROJECT_REF
npx.cmd supabase functions deploy filmhub-ai
```

See `PHASE4_AI.md` for more detail.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm.cmd run dev` | Development server |
| `npm.cmd run build` | Production build → `dist/` |
| `npm.cmd run preview` | Preview production build locally |
| `npm.cmd run lint` | ESLint |

---

## Deploy to Vercel

### 1. Push to GitHub

Ensure `.env` is **not** committed (it is listed in `.gitignore`).

### 2. Import on Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
2. Framework preset: **Vite** (auto-detected).
3. Build command: `npm run build`
4. Output directory: `dist`

### 3. Environment variables (Vercel dashboard)

Add for **Production** (and Preview if desired):

```
VITE_TMDB_API_KEY=...
VITE_TMDB_READ_ACCESS_TOKEN=...
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon...
```

Redeploy after saving env vars.

### 4. Supabase auth redirect URLs

In Supabase → **Authentication → URL Configuration**, add your Vercel URL:

- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/**`

### 5. Edge function

Deploy `filmhub-ai` to the **same** Supabase project used in `VITE_SUPABASE_URL`. AI calls use `supabase.functions.invoke` — no extra frontend URL.

`vercel.json` rewrites all routes to `index.html` for SPA refresh support.

---

## Security notes

- `.env` is gitignored; use `.env.example` as a template only.
- Frontend uses **anon** key only — never `service_role`.
- Groq key lives only in Supabase Edge Function secrets.
- Report/feedback forms use localStorage fallback unless you add `reports` / `feedback` tables in Supabase.

---

## Reset intro (testing)

```javascript
localStorage.removeItem('filmhub_intro_seen');
sessionStorage.removeItem('filmhub_guest_session');
location.reload();
```

---

## TMDB attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

---

## Developer

**Dawit Mamaye** — Computer Science student · [daveasd86@gmail.com](mailto:daveasd86@gmail.com)

Built by Dawit Mamaye as a full-stack portfolio project.
