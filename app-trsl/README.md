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

Without `KV_REST_API_URL` / `KV_REST_API_TOKEN` set, share messages are
stored in `.data/messages.json` on disk. That's fine for local dev but
**does not work once deployed to Vercel** (serverless functions get a
fresh, mostly-read-only filesystem per invocation) — set real KV creds
before shipping.

## What a human needs to configure before this is live

1. **`ANTHROPIC_API_KEY`** — required. From console.anthropic.com. Set as
   a Vercel project env var.
2. **`KV_REST_API_URL` + `KV_REST_API_TOKEN`** — required for share links
   to actually persist in production. Easiest path: add the Vercel KV
   integration to the project (Storage tab → Create Database → KV) — it
   sets these env vars automatically. An Upstash Redis database's REST
   API credentials work identically (same wire protocol).
3. **`public/og-image.png`** — currently a solid-color placeholder
   generated programmatically (no design tool in this environment). Swap
   in a real branded 1200x630 image before sharing this publicly.
4. **Domain** — FINAL.md's acceptance criteria reference
   `trsl.app/m/<uuid>`; deploy to whatever Vercel project/domain is meant
   to serve that. No code changes needed either way, links are always
   relative to whatever host it's deployed on.
5. Deploy: `vercel` or connect the repo in the Vercel dashboard. Framework
   preset: Next.js (auto-detected).

## Architecture notes

- `src/lib/translate.ts` — one Claude API call, system prompt carries both
  the tone instruction and the `DECLINE` guardrail per FINAL.md. No
  separate moderation call.
- `src/lib/storage.ts` — small interface (`saveMessage`/`getMessage`)
  behind two backends (KV REST API vs. file fallback), selected by
  whether KV env vars are present. No ORM, no ID generation logic (that's
  `crypto.randomUUID()` in the API route).
- `src/app/api/translate/route.ts` — enforces the 1000-char cap
  server-side (client also caps via `maxLength` + a check before
  submitting).
- `src/app/m/[id]/page.tsx` — share page; `noindex` + OG tags via Next's
  `Metadata` API, static `og-image.png`, no dynamic per-message
  rendering.
