import React from 'react';
import { Film } from 'lucide-react';

const MAIN_LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'search', label: 'Search' },
  { id: 'watchlist', label: 'Watchlist' },
  { id: 'ai-recommendations', label: 'AI Recs' },
];

const INFO_LINKS = [
  { id: 'about', label: 'About' },
  { id: 'developer', label: 'Developer' },
  { id: 'contact', label: 'Contact' },
  { id: 'report', label: 'Report' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
];

function FooterLink({ pageId, label, currentPage, onNavigate }) {
  const isActive = currentPage === pageId;
  return (
    <button
      type="button"
      onClick={() => onNavigate(pageId)}
      className={`text-sm transition-colors hover:text-brand-gold ${
        isActive ? 'text-brand-gold font-semibold' : 'text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

export default function Footer({ currentPage, onNavigate }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-dark-border bg-dark-bg/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3 text-left">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-gold to-brand-red shadow-lg shadow-brand-red/10">
                <Film className="h-4 w-4 text-black" />
              </div>
              <span className="text-lg font-bold tracking-wide text-white group-hover:text-brand-gold transition-colors">
                Dave&apos;s <span className="text-brand-gold">FilmHub</span>
              </span>
            </button>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Discover, track, and review films — with AI-powered recommendations and a cinematic
              experience.
            </p>
            <p className="text-xs text-gray-600">
              Built by{' '}
              <button
                type="button"
                onClick={() => onNavigate('developer')}
                className="text-gray-400 hover:text-brand-gold transition-colors font-medium"
              >
                Dawit Mamaye
              </button>
            </p>
          </div>

          {/* Explore */}
          <div className="text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Explore
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {MAIN_LINKS.map((link) => (
                <FooterLink
                  key={link.id}
                  {...link}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Product & legal
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {INFO_LINKS.map((link) => (
                <FooterLink
                  key={link.id}
                  {...link}
                  currentPage={currentPage}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-dark-border space-y-2 text-center md:text-left">
          <p className="text-xs text-gray-500">
            &copy; {year} Dave&apos;s FilmHub. All rights reserved.
          </p>
          <p className="text-[11px] text-gray-600 max-w-3xl leading-relaxed">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
