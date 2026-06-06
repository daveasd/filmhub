# FilmHub AI — Groq only

## Setup (free)

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Supabase → **Edge Functions** → **Secrets** → add:
   - Name: `GROQ_API_KEY`
   - Value: your Groq key
4. Deploy:
   ```bash
   npx.cmd supabase functions deploy filmhub-ai
   ```

You can remove `OPENAI_API_KEY` and `GEMINI_API_KEY` from secrets — they are no longer used.

## Security

- Key lives only in Supabase secrets
- Never add `VITE_GROQ_API_KEY` or any key to React / `.env` frontend

## Optional

```bash
supabase secrets set GROQ_MODEL=llama-3.3-70b-versatile
```

## Test

`npm.cmd run dev` → AI Recs → ask a question. Replies should come from Groq (fast, free tier).
