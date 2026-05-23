import React from 'react';
import { Film, Bookmark, Eye, Star, Sparkles, User, Database } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';

const FEATURES = [
  {
    icon: Film,
    title: 'Real movie discovery',
    text: 'Browse trending, popular, top-rated, and mood-based picks powered by the TMDB API.',
  },
  {
    icon: Bookmark,
    title: 'Watchlist',
    text: 'Save films you plan to watch and keep your queue organized.',
  },
  {
    icon: Eye,
    title: 'Watched tracking',
    text: 'Mark titles as watched and build your personal viewing history.',
  },
  {
    icon: Star,
    title: 'Reviews & ratings',
    text: 'Rate movies, write reviews, and sort community-style feedback on titles you care about.',
  },
  {
    icon: Sparkles,
    title: 'AI recommendations',
    text: 'Ask FilmHub AI for tailored suggestions based on your taste, mood, and library.',
  },
  {
    icon: User,
    title: 'Guest & signed-in modes',
    text: 'Explore as a guest with browser storage, or sign in for synced data via Supabase.',
  },
];

export default function AboutPage({ onNavigate }) {
  return (
    <StaticPageLayout
      title="About Dave's FilmHub"
      subtitle="A modern movie discovery and tracking platform built for film lovers and portfolio demonstration."
      icon={Film}
    >
      <StaticCard>
        <p className="text-gray-300 leading-relaxed">
          Dave&apos;s FilmHub helps you discover films, manage your watchlist, track what you have watched,
          write reviews, and get AI-powered recommendations — all in a dark, cinematic interface
          designed for focus and clarity.
        </p>
      </StaticCard>

      <StaticCard>
        <StaticSectionTitle>What you can do</StaticSectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex gap-3 rounded-lg border border-dark-border bg-dark-bg/50 p-4"
            >
              <Icon className="h-5 w-5 text-brand-gold shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-gray-400 text-sm mt-1 leading-relaxed">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </StaticCard>

      <StaticCard>
        <StaticSectionTitle>Powered by</StaticSectionTitle>
        <div className="flex items-start gap-3 text-gray-400 text-sm">
          <Database className="h-5 w-5 text-brand-gold shrink-0" />
          <p className="leading-relaxed">
            TMDB for movie metadata and artwork, Supabase for authentication and cloud sync,
            and Groq (via secure edge functions) for AI recommendations. Guest data stays in
            your browser until you create an account.
          </p>
        </div>
      </StaticCard>

      {onNavigate && (
        <p className="text-sm text-gray-500">
          Meet the developer on the{' '}
          <button
            type="button"
            onClick={() => onNavigate('developer')}
            className="text-brand-gold font-semibold hover:underline"
          >
            Developer
          </button>{' '}
          page.
        </p>
      )}
    </StaticPageLayout>
  );
}
