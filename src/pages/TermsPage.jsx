import React from 'react';
import { FileText } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';

export default function TermsPage() {
  return (
    <StaticPageLayout
      title="Terms of Use"
      subtitle="Simple guidelines for using FilmHub respectfully and responsibly."
      icon={FileText}
    >
      <StaticCard className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <StaticSectionTitle>Respectful use</StaticSectionTitle>
          <p>
            Use FilmHub for personal movie discovery and tracking. Do not attempt to abuse,
            scrape, or disrupt the service or other users&apos; experience.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Reviews & community</StaticSectionTitle>
          <p>
            Do not post abusive, hateful, spam, or misleading reviews. You are responsible for
            content you submit while signed in or as a guest on your device.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Movie data & rights</StaticSectionTitle>
          <p>
            Movie information, images, and trailers are provided by third parties including TMDB.
            Rights belong to their respective owners. FilmHub is a discovery tool, not a streaming
            service.
          </p>
        </section>

        <section>
          <StaticSectionTitle>AI recommendations</StaticSectionTitle>
          <p>
            AI suggestions are generated automatically and may be inaccurate or incomplete. They
            are for entertainment and discovery only — not professional advice.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Your account</StaticSectionTitle>
          <p>
            You are responsible for activity under your account. Keep your login credentials
            secure and notify us if you suspect unauthorized access.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Changes</StaticSectionTitle>
          <p>
            These terms may be updated as FilmHub evolves. Continued use of the app means you
            accept the current version.
          </p>
        </section>
      </StaticCard>
    </StaticPageLayout>
  );
}
