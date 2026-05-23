import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Star, Bookmark, Eye, Heart, ChevronDown } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext.jsx'

/**
 * UserMenu
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop into your Navbar/Header in place of (or next to) your existing avatar.
 *
 * Props:
 *   onOpenAuth  — () => void  — opens the AuthModal (controls it from parent)
 *   onNavigate  — (page: string) => void  — navigate to a page in your router
 */
export default function UserMenu({ onOpenAuth, onNavigate }) {
  const { user, profile, isGuest, isLoggedIn, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = profile?.username ?? user?.user_metadata?.username ?? user?.email ?? 'Guest'
  const avatarLetter = displayName?.[0]?.toUpperCase() ?? 'G'

  // ── Guest / Logged-out state ─────────────────────────────────────────────
  if (!isLoggedIn) {
    if (isGuest) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="h-8 w-8 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-bold">
              G
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate">Guest</span>
          </div>
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-lg border border-dark-border px-3 py-1.5 text-xs font-medium text-gray-400 transition-all hover:border-brand-gold hover:text-brand-gold"
          >
            <User size={14} />
            Sign In
          </button>
        </div>
      )
    }
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <User size={15} />
        Sign In
      </button>
    )
  }

  // ── Logged-in state ──────────────────────────────────────────────────────
  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 group"
      >
        {/* Avatar */}
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-violet-500 transition-all"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-600 to-violet-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10 group-hover:ring-violet-500 transition-all">
            {avatarLetter}
          </div>
        )}
        <span className="hidden md:block text-white/80 text-sm font-medium max-w-[120px] truncate group-hover:text-white transition-colors">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-[#13131a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {/* Profile info */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-white text-sm font-semibold truncate">{displayName}</p>
            <p className="text-white/30 text-xs truncate">{user?.email}</p>
          </div>

          {/* Nav links */}
          <div className="py-1">
            {[
              { icon: User,     label: 'Profile',       page: 'profile'   },
              { icon: Bookmark, label: 'Watchlist',      page: 'watchlist' },
              { icon: Eye,      label: 'Watched',        page: 'watched'   },
              { icon: Star,     label: 'My Reviews',     page: 'reviews'   },
              { icon: Heart,    label: 'Favorites',      page: 'favorites' },
            ].map(({ icon: Icon, label, page }) => (
              <button
                key={page}
                onClick={() => { onNavigate?.(page); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors text-left"
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-white/10 py-1">
            <button
              onClick={() => { signOut(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-sm transition-colors text-left"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
