# v1 Design

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
- On translate success, app generates a unique shareable URL for that
  translated message (e.g. `trsl.app/m/<id>`).
- That URL is a public, permanent, read-only page rendering the translated
  message, with Open Graph tags (og:title, og:description, og:image) so it
  unfurls with a preview card in iMessage/WhatsApp/IG DM/Twitter.
- og:image can be a simple generated card (message text on a branded
  background) — static template is fine, doesn't need to be dynamic-per-word
  art.
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

## Acceptance criteria
1. Visiting the app URL on a mobile browser shows a single textarea and a
   "Translate" (or equivalent) button, no login/signup step anywhere.
2. Typing a raw message and submitting calls a real LLM API and returns a
   translated message within a reasonable wait (loading state shown while
   waiting; a failed API call shows an error state, not a blank/broken
   screen).
3. After translation succeeds, the app shows the translated text and a
   share action (share sheet or copy-link button) — reachable without any
   extra navigation.
4. The share action produces a URL that, when opened in a fresh
   incognito/logged-out browser session, loads and displays the translated
   message text with no login/paywall/blocker.
5. Pasting that URL into iMessage (or an OG-preview debugger, e.g.
   Facebook's Sharing Debugger / Twitter Card Validator) shows a rich
   preview: title, description text (message content or app framing), and
   an image — not a bare blue link.
6. The shared page's OG image and title are generic/app-branded, not a raw
   dump of the literal message text as the page `<title>` in a way that
   would look broken if the message is very long (title should truncate or
   summarize gracefully).
7. The whole flow — load app, type message, translate, get link, open link
   fresh — works on a real deployed URL (not localhost) on both a real
   iOS/Android mobile browser and desktop.
8. Each translate submission creates a new, distinct URL; two different
   input messages never collide on the same link.

## Open questions for critic
1. Translation quality/prompt: is "honest but kind, not corporate, not a
   joke" enough tonal direction, or does the critic want a locked example
   pair (raw input -> translated output) baked into FINAL.md so engineer
   isn't guessing at prompt design?
2. Og:image: static branded template (message text overlaid, same
   background every time) vs. no dynamic rendering pipeline in v1 — I'm
   proposing static-template-with-text-overlay as the ceiling for v1
   effort. Confirm that's acceptable, or does an image with zero per-message
   text feel like a worse "did I get sent something real" signal to the
   recipient?
3. Permanent links with no auth: any objection to translated messages being
   publicly readable by anyone with the URL indefinitely (given content may
   be personal)? I'm treating "obscure random ID = enough" as sufficient
   for v1, no privacy controls.
4. Input length: should there be a max character limit on the raw message
   textarea (for cost/abuse control), and if so is a specific number needed
   in FINAL.md, or is that an engineer implementation detail?
