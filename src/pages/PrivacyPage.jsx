import React from 'react';
import { Shield } from 'lucide-react';
import StaticPageLayout, { StaticCard, StaticSectionTitle } from '../components/StaticPageLayout';

export default function PrivacyPage() {
  return (
    <StaticPageLayout
      title="Privacy Policy"
      subtitle="A straightforward overview of how FilmHub handles your information."
      icon={Shield}
    >
      <StaticCard className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <StaticSectionTitle>Account data</StaticSectionTitle>
          <p>
            When you sign in, profile, watchlist, watched history, and reviews may be stored in
            Supabase and linked to your account. This lets your data sync across sessions.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Guest mode</StaticSectionTitle>
          <p>
            As a guest, your watchlist, watched list, and reviews are stored locally in your
            browser (localStorage). This data stays on your device and is not uploaded unless you
            create an account.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Movie data</StaticSectionTitle>
          <p>
            Posters, titles, descriptions, and ratings come from The Movie Database (TMDB). FilmHub
            does not host full movies — only metadata and links for discovery.
          </p>
        </section>

        <section>
          <StaticSectionTitle>AI recommendations</StaticSectionTitle>
          <p>
            When you use FilmHub AI, your prompts and relevant taste context (such as watchlist size
            or genres you engage with) may be sent to our secure server-side function to generate
            responses. API keys are never exposed in the browser.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Reports & feedback</StaticSectionTitle>
          <p>
            If you submit a report or feedback form, the content you provide is stored so issues
            can be reviewed. Optional email fields are used only if you choose to share them.
          </p>
        </section>

        <section>
          <StaticSectionTitle>Your choices</StaticSectionTitle>
          <p>
            You can clear guest data by clearing your browser storage. Signed-in users can manage
            content through the app or contact the developer for account-related questions.
          </p>
        </section>
      </StaticCard>
    </StaticPageLayout>
  );
}
