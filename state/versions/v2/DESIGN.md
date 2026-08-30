# v2 Design

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

### Mock paywall
- **Where it appears**: on `/m/[id]`, below the translated message, as an
  unlock affordance — visible to every visitor by default (see mechanism
  below for who actually sees the *locked* state vs. skips straight past
  it).
- **Sender vs. receiver, statelessly**: v1 has no accounts and this doesn't
  add any. The device that generated the link marks it as "own" in
  `localStorage` (a set of share ids) at the moment `handleTranslate`
  succeeds. `/m/[id]` checks that set client-side on load: if the current
  id is in it, render the original inline, no paywall, no unlock button —
  this is the sender's own message, nothing to sell them. If it's not in
  the set (any other device/browser, which is what a receiver actually is),
  render the locked state.
  - This is a heuristic, not auth — it's wrong if the sender opens their
    own link in a different browser, a private window, or after clearing
    site data (they'd see the receiver paywall on their own message). That
    trade is intentional for a mock: the paywall only needs to be
    *convincing to a real receiver*, not airtight against the sender
    inspecting their own link. Flagged as an open question below in case
    the critic weighs it differently.
- **Locked state**: translated message shown in full (unchanged from v1).
  Below it, an unlock affordance — a single "Unlock the original — $1"
  button. No card-number input, no fake form fields: a receiver has
  already been asked to trust one made-up UI, a fabricated card form asks
  them to trust two, and it's the slower, less honest-feeling build. One
  button is the whole ask.
- **Unlock flow**: tap → button enters a brief processing state (see Visual
  polish below for the motion) → resolves to unlocked. No real payment
  processor, no server round-trip required for the charge itself — this is
  a client-side state transition gated by a fixed delay to sell "something
  happened." Unlocked state persists per-device via `localStorage` (keyed
  by share id) so a refresh or return visit doesn't re-lock something
  already paid for.
- **Where the original text comes from**: this is the part v1 never
  solved. `SharePayload` gains a second field — `{ t: translated, o:
  original }` — populated in the same `encodeShareId` call already made on
  successful translate (`route.ts` already has both strings in scope at
  that point; it's a one-line payload change, not new plumbing). Both
  strings are covered by the existing HMAC signature, so a tampered id
  still 404s and the original still can't be forged into an id that didn't
  come from a real translate call. `decodeShareId` returns both fields to
  the server-rendered page; the page passes `original` to the client
  component but the *unlock gate is a UI decision, not a data-withholding
  one* — the original is present in the page's initial payload either way
  (this is a static site with no session to gate a fetch behind), and
  "locked" means visually hidden/blurred behind the paywall UI until
  unlock, not fetched separately after payment. This is honest about what
  a mock, no-backend paywall actually is: a UX gate, not a security
  boundary. Acceptable for a phase-2 concept test; not a "receiver can't
  technically get the original via devtools" guarantee, which is out of
  scope (see below).
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
   "something is happening," short enough not to feel fake-slow) → the
   translated text and the unlock button both soften out (opacity + slight
   blur) while the original text resolves in underneath in the same
   position — a cross-fade *substitution*, not a below-the-fold reveal or
   an accordion expand, so it reads as "the mask comes off," which is the
   actual emotional content of this feature. This is the one moment in the
   app worth spending an animation budget on — the rest should stay quiet
   so this doesn't compete with anything.
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

## Scope: out
- Real Stripe/payment integration — no real charge, ever, this iteration.
- Any account/auth system to actually distinguish sender from receiver —
  the localStorage heuristic above is the full mechanism.
- Server-side enforcement that a receiver truly cannot access `original`
  before "paying" (e.g. hiding it from the initial HTML response) — out of
  scope per the "UX gate, not security boundary" call above.
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
3. Tapping the unlock affordance shows a distinct processing state for a
   perceptible, non-instant duration (roughly 1 second), then reveals the
   original raw text in place of (or alongside, engineer's call on final
   layout) the translated text, via a visible transition — not an instant
   swap.
4. After unlocking, reloading `/m/[id]` on the same browser shows the
   original already unlocked (no re-paywall, no repeat payment beat) —
   verifiable via localStorage persistence.
5. Opening a freshly-generated `/m/[id]` link in the *same browser* that
   generated it (i.e. the sender's own device, right after translating)
   shows the original directly, no paywall shown.
6. A hand-crafted or tampered `/m/[id]` id (edited payload or signature)
   still 404s, same as v1 — the payload change does not weaken id
   verification.
7. The share/copy button on `/` shows a distinct confirmation animation
   (not just a static label swap) when a link is copied.
8. No new backend service, database, or payment SDK is introduced —
   `grep`-able: no `stripe` dependency, no new API route beyond what
   already exists for `/api/translate`.
9. Existing v1 acceptance criteria (guardrail, character limit, OG tags,
   noindex, anonymous usage) still pass unmodified — this iteration
   extends the share payload and adds UI, it does not touch the translate
   guardrail or storage model otherwise.

## Open questions for critic
1. **Sender-detection heuristic** — is client-side localStorage (device
   that generated the link skips its own paywall; every other device sees
   it, including the sender on a second device) an acceptable mechanism
   for a mock feature test, or does the critic want a stronger signal
   (e.g. a short-lived signed "sender token" appended to the link the
   sender is shown but never the one they share)? I'm defaulting to the
   simpler localStorage version — it's honest about being a mock and adds
   no new plumbing — but flagging since "does the sender ever see their
   own paywall" affects how convincing the phase-2 test reads to the user
   testing it.
2. **Original text sitting in the page's initial payload pre-unlock** — is
   "visually hidden until unlock, but technically present in the response"
   acceptable for this phase, or does the critic want it fetched
   separately post-unlock (e.g. a trivial `/api/reveal/[id]` route that
   just re-decodes and returns `o`) so a receiver can't trivially read the
   original from view-source before tapping unlock? I lean toward
   "acceptable" — this is a mock testing willingness-to-pay, not a
   security feature, and the receiver would have to deliberately go
   looking — but it's a real trade worth the critic's eyes.
3. **Unlock persistence scope** — localStorage keyed by share id, so
   "unlocked" survives a reload but not a different browser/device. Fine
   for a mock, or does the critic think an unlock that doesn't survive
   switching devices undermines "prove wife will pay" (i.e. she pays, then
   opens the link again on a different device and hits the paywall
   again)? No backend to persist this otherwise without adding one, which
   PRIORITY.md explicitly defers.
4. **Original/translated final layout post-unlock** — criterion 3 leaves
   "in place of vs. alongside" as engineer's call. Any strong opinion
   worth locking now, or is that genuinely a visual-execution detail?
