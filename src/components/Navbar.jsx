import React, { useState } from 'react';
import {
  Film,
  Search,
  Bookmark,
  Star,
  Sparkles,
  User,
  Menu,
  X,
  Info,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import UserMenu from './auth/UserMenu';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Film },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'ai-recommendations', label: 'AI Recs', icon: Sparkles },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'about', label: 'About', icon: Info },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'report', label: 'Report', icon: AlertTriangle },
];

export default function Navbar({ currentPage, setCurrentPage, onOpenAuth }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (pageId) => {
    setCurrentPage(pageId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-dark-border bg-dark-bg/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button
            type="button"
            className="flex shrink-0 items-center gap-2"
            onClick={() => handleNavClick('home')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-gold to-brand-red shadow-lg shadow-brand-red/20">
              <Film className="h-5 w-5 text-black font-bold" />
            </div>
            <span className="text-xl font-bold tracking-wide text-white">
              Dave&apos;s <span className="text-brand-gold">FilmHub</span>
            </span>
          </button>

          {/* Desktop — all links visible */}
          <div
            className="hidden lg:flex flex-1 items-center justify-center gap-4 xl:gap-5 overflow-x-auto scrollbar-none min-w-0"
            style={{ scrollbarWidth: 'none' }}
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex shrink-0 items-center gap-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 hover:text-brand-gold ${
                    isActive ? 'text-brand-gold font-semibold text-glow' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="hidden lg:flex shrink-0 items-center">
            <UserMenu onOpenAuth={onOpenAuth} onNavigate={handleNavClick} />
          </div>

          {/* Mobile */}
          <div className="flex lg:hidden items-center gap-3">
            <UserMenu onOpenAuth={onOpenAuth} onNavigate={handleNavClick} />
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-dark-hover hover:text-white"
              aria-label="Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t border-dark-border bg-dark-bg px-2 pt-2 pb-4 space-y-1 max-h-[70vh] overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                  isActive
                    ? 'bg-brand-gold/10 text-brand-gold'
                    : 'text-gray-300 hover:bg-dark-hover hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
