# v1 Final

## Goal
A husband can open trsl on his phone, type what he actually wants to say, get
back a softened version, and share a link that opens clean in iMessage,
WhatsApp, or IG DM.

## User stories
- As a husband, I can type a raw, unfiltered message so I don't have to find
  the right words myself.
- As a husband, I can get back a translated version I'd actually be willing
  to send, so I trust the app enough to use it for real.
- As a husband, I can get a shareable link for the translated message so I
  can drop it straight into my chat app.
- As a wife (recipient), I can open that link on any device and immediately
  read the message — no login, no app install — so the husband isn't asking
  me to do anything.
- As a husband, I can see how the link/message will look before I send it,
  so I'm not sending something I haven't checked.

## Scope: in
- Single-page mobile-first web app, one screen: textarea in, translated
  output out.
- One text input -> one LLM translate call -> one output. No history, no
  editing the output, no regenerate/retry variants.
- "Translate" produces a softened/sendable rewrite of the raw input (tone:
  honest but kind — not corporate, not a joke).
- **Content guardrail on the translate call**: if the raw input contains
  threats, sexual coercion, or self-harm language, the app declines instead
  of softening it. See "Translation approach" below for the exact
  mechanism.
- On translate success, app generates a unique shareable URL for that
  translated message (`trsl.app/m/<uuid>`).
- That URL is a public, read-only page rendering the translated message,
  with `noindex` and Open Graph tags (og:title, og:description, og:image)
  so it unfurls with a preview card in iMessage/WhatsApp/IG DM/Twitter but
  never gets indexed by search engines.
- og:image is one static, app-branded image asset — same image on every
  share page, no per-message rendering.
- Copy-link / native share button (Web Share API where available, clipboard
  fallback) on the result screen.
- Anonymous usage — no accounts, no login, no auth wall.
- Deployed to a real public URL, working end-to-end today.

## Scope: out
- $1 pay-to-reveal-original paywall (phase 2, per PRIORITY.md).
- Accounts, login, message history, multiple saved messages.
- Editing/regenerating a translation, tone/style picker, multiple translation
  options.
- Analytics/growth mechanics, referral loops.
- Rate limiting / abuse prevention beyond basic sane defaults (engineer's
  call if trivial, not a v1 requirement).
- Native mobile app — web only.
- Message expiry/deletion — links are permanent in v1 (no user-facing delete
  UI; retention policy is an engineer/ops call, not user-facing scope).
- Moderation pipeline / third-party safety API — the guardrail is a single
  prompt instruction on the existing translate call, not a new system.
- Dynamic per-message og:image rendering — static template only.

## Stack (locked, repo currently has no app code)
- **Next.js (App Router), deployed to Vercel.** Fastest real path to a
  mobile-first shareable web app with server routes, OG metadata, and a
  free-tier host, with nothing extra to stand up.
- **Storage**: none. The translated text is base64url-encoded as JSON
  (`{t: translated}`) directly into the `/m/[id]` route param and decoded
  server-side to render the share page. No database, no env vars for
  storage — works immediately on any serverless deploy.

  **Update (post-deploy-prep)**: v1 originally specced Vercel KV. That
  requires provisioning credentials for a payload this small (<=1000
  chars in, ~4000 encoded chars worst case for CJK/non-ASCII input,
  comfortably under Vercel's URL limits) — unnecessary complexity.
  Switched to encoding the payload into the URL itself; the "Share ID"
  bullet below and acceptance criteria 4 and 9 are updated to match: IDs
  are now content-derived by design (that's the whole mechanism), not
  opaque random tokens, and a share page will render whatever text is
  encoded in its URL regardless of whether it ever passed the DECLINE
  guardrail (the guardrail still gates the normal translate-and-share
  flow; it's just not re-checked on raw URL access, same tradeoff as the
  already-accepted unauthenticated-public-links decision below).
- **Translation approach**: server route calls the Anthropic Claude API
  (a fast/cheap model, e.g. Claude Haiku) with a system prompt whose intent
  is:
  > "Rewrite the user's message so it is honest but kind — not corporate,
  > not a joke, not passive-aggressive. Preserve the real point being made;
  > soften tone and word choice, not meaning. If the message contains
  > threats, sexual coercion, or self-harm language (toward the recipient,
  > a third party, or the sender), do not rewrite it — respond with exactly
  > the token `DECLINE` and nothing else."

  The route checks the model's response: if it starts with `DECLINE`
  (trimmed, case-insensitive — tolerates trailing punctuation or
  explanatory text after the token), the app shows a decline state and
  creates no share link; otherwise the response is the translated text and
  the app proceeds to store it and generate a share URL. This is one LLM
  call, not two — no separate moderation API.
- **Share ID**: base64url encoding of `{t: translatedText}`, computed
  server-side on translate success. Not sequential and not guessable in
  the "enumerate other users' messages" sense (decoding it just gives you
  back that same message) — but it is, by design, derived from the
  message content (see Storage above).
- **OG image**: one static PNG committed to `/public/og-image.png`,
  referenced by every share page.
- **OG title/description**: generic and app-branded, not the message text —
  e.g. title `"trsl"`, description `"Someone sent you a message via
  trsl."`. This sidesteps the "does raw text truncate gracefully" question
  entirely: there is no raw text in the metadata to truncate.
- **Share page `<head>`**: `<meta name="robots" content="noindex">` plus
  the OG tags above. The page itself (body) shows the full translated
  message text — noindex only blocks search engines, it does not gate the
  page for a visitor with the link.

## Resolved open questions (from DESIGN.md)
1. **Translation tone/example pair** — "honest but kind, not corporate, not
   a joke" plus the guardrail instruction above is the full spec. No locked
   example pair required; exact phrasing of the system prompt is engineer's
   call as long as it preserves the intent stated above.
2. **og:image** — static branded template, confirmed, no dynamic rendering
   pipeline in v1 (see Stack section).
3. **Permanent, unauthenticated, public links** — accepted for v1 with two
   mandatory mitigations, both now locked: `noindex` meta tag on every
   share page, and UUID v4 share IDs. No further privacy controls (no
   password, no expiry) in v1.
4. **Input character limit** — not a blocker, engineer's call per critic.
   Locked default for a real deployed contract: **max 1000 characters** on
   the textarea (client-side enforced, server route rejects longer input
   with a 400). Engineer may adjust the number later; QA tests against
   1000 for v1.

## Acceptance criteria (locked)
1. Visiting the app URL on a mobile browser shows a single textarea and a
   "Translate" (or equivalent) button, no login/signup step anywhere.
2. Typing a raw message (<=1000 characters) and submitting calls the
   Claude API and returns a translated message within a reasonable wait
   (loading state shown while waiting; a failed API call shows an error
   state, not a blank/broken screen).
3. Submitting a message over 1000 characters is rejected client-side
   (and server-side, if the request reaches the route) with a clear message
   — no API call made, no link generated.
4. Submitting input containing threats, sexual coercion, or self-harm
   language returns a decline state ("This message can't be translated as
   written.") instead of a softened rewrite — no share link is generated
   for declined input. **(Updated post-deploy-prep: this gates the
   translate-and-share UI flow. Since share IDs encode content directly
   with no server-side record, this is not re-checked against a
   hand-crafted `/m/<id>` URL — see Storage in Stack section.)**
5. After a successful (non-declined) translation, the app shows the
   translated text and a share action (share sheet or copy-link button) —
   reachable without any extra navigation.
6. The share action produces a `trsl.app/m/<uuid>` URL that, when opened in
   a fresh incognito/logged-out browser session, loads and displays the
   translated message text with no login/paywall/blocker.
7. The share page's HTML `<head>` includes `<meta name="robots"
   content="noindex">`.
8. Pasting the share URL into iMessage (or an OG-preview debugger, e.g.
   Facebook's Sharing Debugger / Twitter Card Validator) shows a rich
   preview: generic app title ("trsl"), generic description ("Someone sent
   you a message via trsl."), and the static og-image.png — not a bare
   blue link, and never the raw message text in the title/description.
9. Each translate submission creates a share ID (base64url encoding of
   the translated text); two different input messages never collide on
   the same link (different content encodes to different IDs); IDs are
   not sequential. **(Updated post-deploy-prep — no longer UUID v4 /
   non-content-derived; see Storage in Stack section.)**
10. The whole flow — load app, type message, translate, get link, open
    link fresh — works on a real deployed URL (not localhost) on both a
    real iOS/Android mobile browser and desktop.

## Disagreements noted (none)
Both critic blockers were accepted as-is; no unresolved disagreement to
carry forward.
