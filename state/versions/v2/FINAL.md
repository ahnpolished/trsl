# v2 Final

## Goal
A receiver opening a trsl link can pay a mock $1 to reveal what the sender
actually wrote, and the whole app — translate, share, unlock — now feels
like something worth reaching for, not a form that happens to work.

## User stories
- As a receiver, I can see the softened message immediately, then choose to
  unlock the sender's original raw text if I'm curious what it "really"
  said, so I get to decide how much truth I want.
- As a receiver, I can tap a clear $1 unlock action and — after a believable
  payment beat — see the original text revealed in place, so the unlock
  feels like a real moment, not a toggle.
- As a sender, opening my own share link does not put me through my own
  paywall, so I'm not asked to pay to see the message I wrote.
- As a husband, the translate and unlock moments feel considered and a
  little delightful, so the app reads as a product, not a prototype.

## Scope: in

### Mock paywall (server-gated)
- **Where it appears**: on `/m/[id]`, below the translated message, as an
  unlock affordance — visible to every visitor by default (see mechanism
  below for who actually sees the *locked* state vs. skips straight past
  it).
- **`original` never ships in the initial page payload.** This is the
  fix from DISCUSSION.md objection 1 and it's not optional. `SharePayload`
  gains a second field — `{ t: translated, o: original }` — populated in
  the same `encodeShareId` call already made on successful translate
  (`route.ts` already has both strings in scope; one-line payload change).
  Both fields are covered by the existing HMAC signature. But
  `decodeShareId` on the server-rendered `/m/[id]` page returns and sends
  the client **only `translated`** (plus enough of the signed id to make a
  reveal call later — the id itself). `original` stays server-side until a
  dedicated request asks for it.
- **`/api/reveal/[id]` route (new)**: re-decodes the share id, re-verifies
  the HMAC signature (same verification `/m/[id]` already does — reused,
  not reimplemented), and on success returns `{ original }`. On a bad/
  tampered signature it 404s, identical to how `/m/[id]` already handles a
  bad id. This is the only place `original` ever leaves the server. No new
  storage, no new signing scheme — it's the existing decode function
  behind one more route.
- **Sender vs. receiver, statelessly**: v1 has no accounts and this
  doesn't add any. The device that generated the link marks it as "own" in
  `localStorage` (a set of share ids) at the moment `handleTranslate`
  succeeds. `/m/[id]` checks that set client-side on load: if the current
  id is in it, the client immediately calls `/api/reveal/[id]` and renders
  the original inline, no paywall, no unlock button, no processing-state
  animation (this is the sender re-reading their own message, not the $1
  moment). If it's not in the set, render the locked state.
  - **This localStorage flag is a UI convenience, not the reveal
    authorization.** The reveal endpoint does not check or trust
    localStorage in any way — it only checks the HMAC signature on the id,
    same as every other caller of it. Setting the flag by hand in devtools
    changes which screen you see; it does not change whether the request
    to `/api/reveal/[id]` succeeds, because that request already succeeds
    for anyone who calls it with a valid id, sender or not. Locking that
    down further (e.g. rate-limiting or requiring the unlock tap as a
    precondition server-side) is explicitly out of scope — see below.
  - This is a known-spoofable heuristic, accepted as such for this
    mock-paywall iteration: it's wrong if the sender opens their own link
    in a different browser, a private window, or after clearing site data
    (they'd see the receiver paywall on their own message, and have to tap
    unlock like anyone else — which just calls the same reveal endpoint,
    so it still works, just with the $1 beat shown). Real auth
    (accounts, sessions, a signed per-recipient token) is not being built
    this iteration; the flag only needs to spare the *common case* sender
    the friction, not resist someone deliberately spoofing it.
- **Locked state**: translated message shown in full (unchanged from v1).
  Below it, an unlock affordance — a single "Unlock the original — $1"
  button. No card-number input, no fake form fields: a receiver has
  already been asked to trust one made-up UI, a fabricated card form asks
  them to trust two, and it's the slower, less honest-feeling build. One
  button is the whole ask.
- **Unlock flow**: tap → button enters a brief processing state (see
  Visual polish below for the motion, ~900ms–1.2s) → client calls
  `/api/reveal/[id]` → response resolves to unlocked, original text
  rendered in place. No real payment processor — the "charge" is a
  client-side timed state transition that gates *when* the reveal call
  fires, not a check on whether it succeeds; the fetch itself is real and
  is the actual gate on ever seeing `original`. Unlocked state persists
  per-device via `localStorage` (a set of unlocked share ids) so a refresh
  or return visit skips the paywall and calls `/api/reveal/[id]` directly
  (no repeat payment beat, no re-paywall).
- Declined translations never had a share link in v1 and still don't in
  v2 — nothing to paywall there.

### Visual / animation polish
Scope: the whole app (translate screen, share page), not one screen —
three named moments, restrained motion, nothing performative.

1. **Translate reveal** (`/`, on successful translate): the result box
   currently just appears. Give the translated text a soft entrance — a
   short blur-to-sharp + fade-up on the text block (blur(6px)→0,
   translateY(8px)→0, ~300–400ms, ease-out), not a typewriter effect and
   not per-character stagger — this is a considered rewrite arriving, not
   a machine printing. The share button follows ~80ms after, not
   simultaneously, so the two don't compete for attention.
2. **Unlock reveal** (`/m/[id]`, the moment that earns the $1): tap →
   button label swaps to a short processing state (a subtle pulse or
   width-morph on the button itself, ~900ms–1.2s — long enough to read as
   "something is happening," short enough not to feel fake-slow, and long
   enough to comfortably cover the `/api/reveal/[id]` round-trip) → the
   translated text and the unlock button both soften out (opacity + slight
   blur) while the original text resolves in underneath in the same
   position — a cross-fade *substitution*, not a below-the-fold reveal or
   an accordion expand, so it reads as "the mask comes off," which is the
   actual emotional content of this feature. This is the one moment in the
   app worth spending an animation budget on — the rest should stay quiet
   so this doesn't compete with anything. If the reveal fetch is still
   pending when the processing-state timer ends, hold the processing state
   until it resolves rather than showing a swap with no text yet —
   engineer's call on exact implementation, but the transition never fires
   before the original is actually in hand.
3. **Share action** (`/`, existing copy/share button): the button already
   swaps label to "Copied!" — give that swap a small scale-pulse
   (1 → 1.04 → 1, ~150ms) on the button itself instead of a bare text
   swap, so the confirmation is felt, not just read.
- General direction: dark, quiet, generous whitespace already implied by
  v1's palette — polish means confident restraint (consistent easing,
  consistent timing scale, one accent color already in use for actionable
  elements) over adding new colors, icons, or decorative chrome. No
  confetti, no shimmer/skeleton loaders standing in for content, no motion
  on anything that isn't one of the three moments above.

### Post-unlock layout
Replace the translated text with the original in place (same position the
translated text occupied), and keep a small "originally: <translated>"
note below it for context — so the receiver can still see what the
softened version said without the two full texts competing for attention.
Not a side-by-side layout, not a collapsible section — one line of muted
context under the now-primary original text.

## Scope: out
- Real Stripe/payment integration — no real charge, ever, this iteration.
- Any account/auth system to actually distinguish sender from receiver —
  the localStorage heuristic above, for UI routing only, is the full
  mechanism. It is explicitly not a security boundary and is not being
  hardened into one this iteration.
- Authorizing or rate-limiting `/api/reveal/[id]` beyond signature
  verification (e.g. requiring proof the client actually showed the
  processing state, one-reveal-per-id enforcement, requiring the unlock
  tap as a server-checked precondition) — the endpoint's only job this
  iteration is "don't ship `original` in the initial page payload"; anyone
  with a valid id can still call it directly, same trust level as v1's
  `/m/[id]` already had for `translated`.
- Persisting unlock/payment state anywhere but the unlocking device's
  localStorage — no backend, no analytics on unlock rate this iteration.
- Multiple paywall price points, discounts, or bundles — one fixed "$1"
  label, not wired to any real currency logic.
- Redesigning the visual system wholesale (new color palette, typography
  system, layout grid) — polish is motion + the existing look tightened
  up, not a rebrand.
- Animating anything outside the three named moments (page transitions,
  input focus states, loading spinners beyond what v1 already has) unless
  trivial and additive — engineer's call, not required.

## Acceptance criteria
1. On `/`, after a successful (non-declined) translate, the result text
   block animates in (visibly distinct from an instant/no-transition
   appearance) rather than popping in unstyled.
2. Visiting a `/m/[id]` link on a device/browser that did not generate it
   shows the translated message plus a visible "Unlock the original — $1"
   affordance, and does **not** show the original text before that
   affordance is tapped.
3. **The server-rendered `/m/[id]` response (view-source / initial
   HTML+JSON payload, before any unlock interaction) contains the
   translated text but does not contain the original text anywhere in the
   markup, embedded JSON, or inline script.** The original is retrievable
   only via a request to `/api/reveal/[id]` (or equivalent), never present
   on load.
4. Tapping the unlock affordance shows a distinct processing state for a
   perceptible, non-instant duration (roughly 1 second), triggers a call
   to `/api/reveal/[id]`, and then reveals the original raw text in place
   of the translated text (with a small "originally: <translated>" note
   retained below it), via a visible cross-fade transition — not an
   instant swap, and not before the reveal response has actually returned.
5. After unlocking, reloading `/m/[id]` on the same browser shows the
   original already unlocked (no re-paywall, no repeat payment beat) —
   verifiable via localStorage persistence; the reveal endpoint is called
   again on load to fetch the original (it is never cached client-side in
   a way that would have required storing it before the paywall).
6. Opening a freshly-generated `/m/[id]` link in the *same browser* that
   generated it (i.e. the sender's own device, right after translating)
   shows the original directly, no paywall shown — via the same
   `/api/reveal/[id]` call, gated by the localStorage sender flag on the
   client, not by any special server-side privilege.
7. A hand-crafted or tampered `/m/[id]` id (edited payload or signature),
   and a hand-crafted or tampered id passed to `/api/reveal/[id]`
   directly, both still 404 — the payload change and the new route do not
   weaken id verification.
8. The share/copy button on `/` shows a distinct confirmation animation
   (not just a static label swap) when a link is copied.
9. No new backend service, database, or payment SDK is introduced —
   `grep`-able: no `stripe` dependency, no new API route beyond
   `/api/translate` and the one new `/api/reveal/[id]`.
10. Existing v1 acceptance criteria (guardrail, character limit, OG tags,
    noindex, anonymous usage) still pass unmodified — this iteration
    extends the share payload and adds UI plus one new API route, it does
    not touch the translate guardrail or storage model otherwise.

## Resolved (was open questions)
1. **Sender-detection heuristic** — accepted as-is: localStorage flag,
   client-side only, UI routing only. Known-spoofable (different browser,
   private window, cleared storage all break it), and that's fine — it's
   a mock paywall, not an auth system, and building real auth here would
   be over-engineering a phase-2 concept test. Not revisited by the fix in
   objection 2 below beyond confirming the flag carries no authority over
   the reveal endpoint.
2. **Original text pre-unlock** — resolved by moving to a server-side
   reveal endpoint (`/api/reveal/[id]`) instead of shipping `original` in
   the initial payload. `original` is now absent from the page's initial
   HTML/JSON entirely; it is fetched only on an explicit reveal call
   (paywall tap, or the sender's auto-reveal). This closes both the
   paywall-is-fake problem and the "unfiltered text traveling in a
   forwardable link" concern from DISCUSSION.md — the link itself no
   longer carries the original anywhere.
3. **Unlock persistence scope** — per-device via localStorage, confirmed
   fine for a mock. She pays, it stays unlocked on the device she paid on;
   a different device hits the paywall again and can pay (or, if it's the
   sender's own second device, will still auto-reveal without a paywall
   since the flag is per-browser-storage, not per-person). No backend to
   persist across devices, and none is being added this iteration.
4. **Post-unlock layout** — locked: replace translated with original in
   place, keep a small "originally: <translated>" note underneath for
   context. See Visual polish / Post-unlock layout above.
