# trsl

Mobile-first single-screen app: type a raw message, get a softened
translation back, share it via a link. See `state/versions/v1/FINAL.md` in
the repo root for the locked spec.

## Local dev

```
npm install
cp env.example .env.local   # then fill in ANTHROPIC_API_KEY at minimum
npm run dev
```

Without `ANTHROPIC_API_KEY` set, translate requests return a clean 502
error (no crash) — the UI shows an error state.

Share links need no database: the translated text is base64url-encoded
directly into the `/m/[id]` URL and decoded server-side to render the
page. No KV, no env vars for storage, works immediately on any serverless
deploy.

## What a human needs to configure before this is live

1. **`ANTHROPIC_API_KEY`** — required. From console.anthropic.com. Set as
   a Vercel project env var.
2. **`public/og-image.png`** — currently a solid-color placeholder
   generated programmatically (no design tool in this environment). Swap
   in a real branded 1200x630 image before sharing this publicly.
3. **Domain** — FINAL.md's acceptance criteria reference
   `trsl.app/m/<id>`; deploy to whatever Vercel project/domain is meant
   to serve that. No code changes needed either way, links are always
   relative to whatever host it's deployed on.
4. Deploy: `vercel` or connect the repo in the Vercel dashboard. Framework
   preset: Next.js (auto-detected).

## Architecture notes

- `src/lib/translate.ts` — one Claude API call, system prompt carries both
  the tone instruction and the `DECLINE` guardrail per FINAL.md. No
  separate moderation call.
- `src/lib/share.ts` — `encodeShareId`/`decodeShareId`: the share ID *is*
  the message, base64url-encoded JSON. No database, no ID generation, no
  persistence layer at all.
- `src/app/api/translate/route.ts` — enforces the 1000-char cap
  server-side (client also caps via `maxLength` + a check before
  submitting).
- `src/app/m/[id]/page.tsx` — share page; `noindex` + OG tags via Next's
  `Metadata` API, static `og-image.png`, no dynamic per-message
  rendering.
