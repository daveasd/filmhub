import React from 'react';
import { Mail, Code2, Link2, Send, Globe, MessageCircle } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';

const LINKS = [
  { icon: Code2, label: 'GitHub', href: '#', placeholder: true },
  { icon: Link2, label: 'LinkedIn', href: '#', placeholder: true },
  { icon: MessageCircle, label: 'Telegram', href: '#', placeholder: true },
  { icon: Globe, label: 'Portfolio', href: '#', placeholder: true },
];

export default function ContactPage({ onNavigate }) {
  return (
    <StaticPageLayout
      title="Contact"
      subtitle="Reach out for bugs, feedback, collaboration, or questions about FilmHub."
      icon={Mail}
    >
      <StaticCard className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Name</p>
          <p className="text-xl font-bold text-white mt-1">Dawit Mamaye</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">Email</p>
          <a
            href="mailto:daveasd86@gmail.com"
            className="text-brand-gold font-semibold hover:underline mt-1 inline-flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            daveasd86@gmail.com
          </a>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed border-t border-dark-border pt-4">
          You can contact me about bug reports, feature ideas, collaboration opportunities,
          portfolio inquiries, or general questions about this project. I aim to respond when
          possible — thank you for using FilmHub.
        </p>
      </StaticCard>

      <StaticCard>
        <StaticSectionTitle>Links</StaticSectionTitle>
        <p className="text-gray-500 text-xs mb-4">
          Placeholder links — update with your live profiles before deployment.
        </p>
        <ul className="space-y-2">
          {LINKS.map(({ icon: Icon, label, href }) => (
            <li key={label}>
              <a
                href={href}
                className="flex items-center gap-3 rounded-lg border border-dark-border bg-dark-bg/50 px-4 py-3 text-gray-300 hover:border-brand-gold/40 hover:text-brand-gold transition-colors"
                onClick={(e) => href === '#' && e.preventDefault()}
              >
                <Icon className="h-5 w-5 text-brand-gold" />
                <span className="font-medium">{label}</span>
                <span className="ml-auto text-xs text-gray-600">Coming soon</span>
              </a>
            </li>
          ))}
        </ul>
      </StaticCard>

      <StaticCard className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">Prefer a form?</h3>
          <p className="text-gray-400 text-sm mt-1">
            Send structured feedback or report an issue directly in the app.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('feedback')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-gold/10 border border-brand-gold/40 text-brand-gold font-semibold text-sm px-4 py-2.5 hover:bg-brand-gold/20 transition-colors"
              >
                <Send className="h-4 w-4" />
                Feedback
              </button>
              <button
                type="button"
                onClick={() => onNavigate('report')}
                className="inline-flex items-center gap-2 rounded-lg border border-dark-border text-gray-300 font-semibold text-sm px-4 py-2.5 hover:border-brand-gold/40 hover:text-white transition-colors"
              >
                Report a problem
              </button>
            </>
          )}
        </div>
      </StaticCard>
    </StaticPageLayout>
  );
}
