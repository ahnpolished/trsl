# v1 Changelog

Built a hand-written Next.js (App Router) app at `app-trsl/`. `npm run build`
succeeds. No live API keys in this sandbox (see README "What a human needs to
configure" for the deploy checklist) — code paths for missing keys were
exercised and return clean error states, not crashes.

## Mapped to acceptance criteria (FINAL.md)

1. **Single textarea + Translate button, no login** — `src/app/page.tsx`.
   Verified: home page HTML contains the textarea, no auth anywhere in the
   flow.
2. **Translate calls Claude API, loading state, error state** —
   `src/lib/translate.ts` (one Claude Haiku call) +
   `src/app/api/translate/route.ts`. Client shows "Translating…" while
   pending and a visible error message on failure. Verified against a live
   dev server with `ANTHROPIC_API_KEY` unset: returns 502 with a clean
   error string, no crash, no blank screen.
3. **1000-char cap, client + server** — `maxLength={1000}` on the
   textarea plus a client-side length check before submit; server route
   independently rejects >1000 chars with 400 and makes no API call, no
   share link. Verified: a 1001-char POST returns 400
   `"Message is too long (max 1000 characters)."`.
4. **DECLINE guardrail** — system prompt in `src/lib/translate.ts` carries
   the exact instruction from FINAL.md; route checks whether the trimmed
   response starts with `DECLINE` (case-insensitive) and returns
   `{declined: true}` with no share ID created. UI shows "This message
   can't be translated as written."

   **Fix (post-QA, P1-1)**: the original check was an exact-string
   equality (`text.trim() === "DECLINE"`), which failed open on any minor
   model output variation — e.g. `"DECLINE."` with trailing punctuation
   was treated as a normal translation and stored/shared. Changed to a
   prefix match (`text.toUpperCase().startsWith("DECLINE")`) so trailing
   punctuation or explanatory text after the token no longer bypasses the
   guardrail. FINAL.md's mechanism description updated to match.
5. **Post-translate share action reachable without navigation** — result
   card renders inline below the textarea with a Share button
   (`handleShare` in `page.tsx`): Web Share API when available, clipboard
   fallback otherwise.
6. **`/m/<uuid>` loads with no login/paywall** — `src/app/m/[id]/page.tsx`,
   a public server component reading from storage by ID. Verified: seeded
   a message into the fallback store and fetched the page fresh — 200,
   full translated text rendered, no auth.
7. **`noindex` meta tag** — set via Next's `Metadata.robots` API on the
   share page. Verified in rendered HTML:
   `<meta name="robots" content="noindex">`.
8. **OG preview (generic title/description, static image)** — `openGraph`
   metadata on the share page: title `"trsl"`, description `"Someone sent
   you a message via trsl."`, image `/public/og-image.png`. Verified tags
   present in rendered HTML. **Caveat**: `og-image.png` is a
   programmatically generated solid-color placeholder (no design tool
   available in this sandbox) — swap for a real branded asset before
   shipping (same filename, same code).
9. **Share IDs, no collisions** — `src/lib/share.ts`, `encodeShareId()`
   called once per successful translate in the API route.

   **Update (deploy prep)**: switched from `crypto.randomUUID()` +
   Vercel KV to base64url-encoding `{t: translatedText}` directly as the
   ID — no database. Different messages still never collide (different
   content = different encoding), but IDs are no longer
   non-content-derived random tokens; FINAL.md's Storage/Share ID/
   criterion-9 text updated to match.

   **Update (security fix)**: the payload is now HMAC-SHA256-signed
   server-side (`SHARE_SECRET`) and verified on decode — see Storage
   below.
10. **End-to-end on a real deployed URL, mobile + desktop** — **not
    verified** — this sandbox has no deploy target and no live Anthropic
    API key. Everything up to that boundary (build, routing, storage
    interface, guardrail logic, meta tags) is verified locally. See
    `app-trsl/README.md` for exactly what a human must supply
    (`ANTHROPIC_API_KEY`, KV REST creds, a real og-image, and a Vercel
    deploy) to close this out.

## Storage

**Update (deploy prep)**: removed the Vercel KV / Upstash dependency
entirely — deploying for real without provisioning creds for a payload
this small wasn't worth it. `src/lib/share.ts` now encodes
`{t: translatedText}` as base64url straight into the `/m/[id]` URL and
decodes it server-side on page load — no database, no storage env vars,
no serverless-filesystem caveat, works identically in dev and prod. The
old `src/lib/storage.ts` (KV + file-fallback) is deleted. Worst case
(1000 CJK chars) encodes to ~4000 URL chars — measured, comfortably
under Vercel's request-URL limits.

**Update (security fix)**: the original version of this had no
server-side record, so anyone could base64url-encode arbitrary text and
get it rendered as a branded share page, bypassing the DECLINE guardrail
entirely on direct URL access. Fixed by HMAC-SHA256-signing the payload
server-side (`SHARE_SECRET` env var, `src/lib/share.ts`) and verifying
the signature on decode — a tampered/hand-crafted id now fails
verification and 404s, same as garbage input. No database added; the
mechanism is still URL-is-the-payload, just signed.

## Explicitly out of scope (per FINAL.md, not built)

Paywall, accounts/login, message history, editing/regenerating
translations, analytics, rate limiting, native app, message
expiry/deletion, third-party moderation pipeline, dynamic per-message
og:image.
