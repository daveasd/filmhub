import React from 'react';
import { Code2, Shield, Sparkles, Layers } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';

const STACK = [
  'React + Vite',
  'Supabase (auth & database)',
  'TMDB API',
  'Groq AI recommendations',
  'Responsive UI/UX (Tailwind CSS)',
];

export default function DeveloperPage() {
  return (
    <StaticPageLayout
      title="Developer"
      subtitle="The person behind FilmHub."
      icon={Code2}
    >
      <StaticCard className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dawit Mamaye</h2>
          <p className="text-brand-gold text-sm font-medium mt-1">
            Computer Science student · Full-stack developer
          </p>
        </div>
        <p className="text-gray-300 leading-relaxed">
          Dawit Mamaye is a Computer Science student and developer building FilmHub as a modern
          full-stack movie platform. He is interested in software engineering, AI-powered
          applications, cybersecurity, and useful real-world products that solve practical problems.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          FilmHub was created as a portfolio-grade project: real APIs, authentication, persistent
          data, and thoughtful UX — not a static mockup.
        </p>
      </StaticCard>

      <StaticCard>
        <StaticSectionTitle>Tech stack</StaticSectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {STACK.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-sm text-gray-300 rounded-lg border border-dark-border bg-dark-bg/50 px-3 py-2"
            >
              <Layers className="h-4 w-4 text-brand-gold shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </StaticCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <StaticCard>
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-brand-gold shrink-0" />
            <div>
              <h3 className="font-semibold text-white text-sm">AI & product</h3>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Integrates Groq-powered recommendations with user context while keeping API keys
                server-side.
              </p>
            </div>
          </div>
        </StaticCard>
        <StaticCard>
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-brand-gold shrink-0" />
            <div>
              <h3 className="font-semibold text-white text-sm">Security mindset</h3>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Interested in building secure, maintainable systems — from auth flows to safe
                client/server boundaries.
              </p>
            </div>
          </div>
        </StaticCard>
      </div>
    </StaticPageLayout>
  );
}
