# FilmHub — Phase 3: Supabase Integration Guide

Complete step-by-step instructions for wiring the new auth/data layer
into your existing React app — without rewriting anything.

---

## 1. New files created (copy into your project)

```
src/
  lib/
    supabase.js               ← Supabase client singleton
  contexts/
    AuthContext.jsx           ← Auth state, sign in/up/out, guest mode
  services/
    dataService.js            ← All CRUD (Supabase ↔ localStorage routing)
    useData.js                ← React hooks wrapping dataService
  components/
    auth/
      AuthModal.jsx           ← Sign in / sign up / guest modal
      UserMenu.jsx            ← Avatar dropdown (replaces your old avatar button)
supabase_schema.sql           ← Run this in Supabase SQL Editor
```

---

## 2. .env values (your .env file already has these)

```env
VITE_TMDB_API_KEY=6a74a05756079ecd7f71a2129128ee94
VITE_TMDB_READ_ACCESS_TOKEN=eyJhbGciOiJIUzI1NiJ9...
VITE_SUPABASE_URL=https://izsuvnyictnwcqvarzvz.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_sFSjCtKpLh8yi5PWLnLfkg_1w0tKQgF
```

⚠️  NEVER add SUPABASE_SERVICE_ROLE_KEY or any secret to .env or any client file.

---

## 3. Wrap your app with AuthProvider

### src/main.jsx — change this:

```jsx
// BEFORE
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```jsx
// AFTER — add AuthProvider import + wrap
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
```

---

## 4. Show the AuthModal on first load (gate)

In your **App.jsx** (or wherever you handle initial routing/page state):

```jsx
import { useState, useEffect } from 'react'
import { useAuth } from './contexts/AuthContext'
import AuthModal from './components/auth/AuthModal'
import UserMenu from './components/auth/UserMenu'

export default function App() {
  const { isLoggedIn, isGuest, loading } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  // Show auth gate on first load if not yet decided
  useEffect(() => {
    if (!loading && !isLoggedIn && !isGuest) {
      setShowAuth(true)
    }
  }, [loading, isLoggedIn, isGuest])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#060608] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Your existing app JSX unchanged below */}
      {/* ... */}

      {/* Add AuthModal somewhere near the root */}
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
```

---

## 5. Replace your avatar/login button in the Navbar

Find wherever you render a "Sign In" button or user avatar in your Navbar/Header,
and swap it with:

```jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './auth/AuthModal'
import UserMenu from './auth/UserMenu'

// Inside your Navbar component:
const { isLoggedIn } = useAuth()
const [showAuth, setShowAuth] = useState(false)

// In JSX — replace existing avatar/login button area with:
<>
  <UserMenu
    onOpenAuth={() => setShowAuth(true)}
    onNavigate={(page) => setCurrentPage(page)}  // your existing nav fn
  />
  <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
</>
```

---

## 6. Replace existing localStorage calls with dataService hooks

### BEFORE (existing pattern — keep working for now, swap gradually):
```jsx
// Old: direct localStorage
const watchlist = JSON.parse(localStorage.getItem('filmhub_watchlist') || '[]')
localStorage.setItem('filmhub_watchlist', JSON.stringify([...watchlist, movie]))
```

### AFTER — use the hooks in any component:
```jsx
import { useWatchlist } from '../services/useData'
import { useAuth } from '../contexts/AuthContext'

function MovieCard({ movie }) {
  const { user } = useAuth()
  const { has, add, remove } = useWatchlist(user)

  const inList = has(movie.id)

  return (
    <button onClick={() => inList ? remove(movie.id) : add(movie)}>
      {inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
    </button>
  )
}
```

### All available hooks from src/services/useData.js:
```js
const { items, add, remove, has, refresh } = useWatchlist(user)
const { items, mark, unmark, has, refresh } = useWatched(user)
const { items, add, remove, has, refresh }  = useFavorites(user)
const { reviews, submit, remove, refresh }  = useMyReviews(user)
const { reviews, submit, remove, refresh }  = useMovieReviews(movieId, user)
const { rating, setRating }                 = useRating(movieId, user)
const { stats, loading }                    = useUserStats(user)
```

### Or call dataService functions directly:
```js
import { addToWatchlist, removeFromWatchlist } from '../services/dataService'
import { useAuth } from '../contexts/AuthContext'

const { user } = useAuth()
await addToWatchlist(movie, user?.id)   // user?.id = undefined → localStorage
await removeFromWatchlist(movie.id, user?.id)
```

---

## 7. Profile page

```jsx
import { useAuth } from '../contexts/AuthContext'
import { useUserStats } from '../services/useData'

function ProfilePage() {
  const { user, profile, isGuest, updateProfile } = useAuth()
  const { stats } = useUserStats(user)

  const displayName = profile?.username ?? 'Guest'

  return (
    <div>
      <h1>{displayName}</h1>
      {stats && (
        <>
          <p>Watched: {stats.watchedCount}</p>
          <p>Watchlist: {stats.watchlistCount}</p>
          <p>Reviews: {stats.reviewCount}</p>
          <p>Avg Rating: {stats.avgRating ?? '—'}</p>
          <p>Favorites: {stats.favoritesCount}</p>
        </>
      )}
    </div>
  )
}
```

---

## 8. Run the SQL schema

1. Go to https://app.supabase.com → your project
2. Click **SQL Editor** → **New query**
3. Paste the entire contents of `supabase_schema.sql`
4. Click **Run**
5. You should see: "Success. No rows returned."

---

## Manual Test Checklist

### Auth
- [ ] Open app fresh → AuthModal appears automatically
- [ ] "Continue as Guest" → modal closes, app works normally
- [ ] Sign Up with email + password + username → success message
- [ ] Confirm email (check inbox) → then sign in
- [ ] Sign In with wrong password → error message shown
- [ ] Sign In correctly → UserMenu avatar appears in navbar
- [ ] UserMenu dropdown → shows username and email
- [ ] Sign Out → returns to guest / show auth gate

### Guest mode (localStorage)
- [ ] Add movie to watchlist → persists on page refresh
- [ ] Mark movie as watched → removed from watchlist, appears in watched
- [ ] Write a review → appears in reviews list
- [ ] Profile page shows correct counts

### Logged-in mode (Supabase)
- [ ] Add movie to watchlist → sign out → sign back in → still in watchlist
- [ ] Mark as watched → still persists after re-login
- [ ] Write a review → visible to any logged-out visitor (public)
- [ ] Delete your own review → gone
- [ ] Cannot delete another user's review (RLS prevents it)
- [ ] Profile page shows stats from DB

### TMDB (must still work)
- [ ] Home page hero + sliders load movies
- [ ] Search returns real results
- [ ] Movie detail page shows cast, trailer, runtime
- [ ] Cast images load correctly

### Build
- [ ] npm.cmd run build → no errors
- [ ] npm.cmd run preview → app loads and works

---

## localStorage key reference (unchanged — guest data survives upgrade)

| Feature       | Key                    |
|---------------|------------------------|
| Watchlist     | filmhub_watchlist      |
| Watched       | filmhub_watched        |
| Reviews       | filmhub_reviews        |
| Ratings       | filmhub_ratings        |
| Favorites     | filmhub_favorites      |

These keys are used by `dataService.js` when no `userId` is passed,
ensuring existing guest data is preserved exactly as-is.
