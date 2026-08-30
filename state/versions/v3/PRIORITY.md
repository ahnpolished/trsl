# v3 Priority

## Item
Add sender-side context to the translate call: an optional short "context"
input (who it's to, what happened, desired tone — free text, small char cap)
plus a small set of one-tap tone presets, both consumed by a rewritten
system prompt in `translate.ts`. Voice input, image/video attachments, and
the multimodal composer UI from the reference image are explicitly cut —
see "Not now" below.

## Why this, why now
The user's raw complaint is translation quality ("out of context, makes no
sense sometimes"), not a new mechanic. `translate.ts` today calls
`translate(raw: string)` with a one-sentence system prompt and zero
situational input — the model has nothing but the bare message to work
from, so "out of context" isn't a model failure, it's a missing-input
failure. This is a precondition of Phase 2's own north star, not a
competing phase: the $1 unlock only has something worth paying for if the
gap between translated and original reads as a *real, credible* softening
of what was actually meant. If the translation itself is off-target or
nonsensical, there's no intrigue to unlock — just noise next to noise.
Phase 2 already frames "worth paying into" as a visual-bar problem; this
extends it to an output-bar problem, same phase, no ROADMAP rewrite needed
beyond the amendment below.

## What's in scope
- **Optional context field**: short free text alongside the message
  ("who's this to, what happened, tone you want"), capped (~200 chars,
  engineer's call), sent to `translate()` as a second parameter and
  interpolated into a rewritten system prompt — not just accepted and
  ignored. The prompt itself needs real rework (few-shot-ish grounding,
  explicit "use this context to resolve ambiguity" instruction), not a
  cosmetic addition of one more template variable. That prompt work is
  in scope for this item, mechanism is product-designer/engineer's call.
- **Tone presets**: a small one-tap chip row (e.g. "apology", "asking for
  space", "setting a boundary", "just being honest") that either seeds the
  context field or is passed as a separate short enum to the prompt —
  cheaper for the sender than typing, and the one piece of the reference
  composer image that actually transfers to a text app (the palette/style
  icon, not the attachment row).
- **Sender-side only.** Context/tone never appears on `/m/[id]` or in the
  encrypted share payload — the receiver only ever sees `translated`,
  exactly as today. This keeps the id/crypto format (`{ t, o }` -> AES-GCM
  blob) completely untouched: zero blast radius on the reveal mechanism,
  no version-byte question raised. If a later iteration wants the receiver
  to see "sent with context: X," that's a deliberate follow-up, not a side
  effect of this one.

## Not now (and why)
- **Voice-to-text.** Mobile keyboards already put a dictation mic on every
  text field at the OS level — iOS/Android native, zero app code. Building
  a custom voice input duplicates something the platform gives for free;
  revisit only if a real user complaint says the native mic isn't
  discoverable enough on the composer, not preemptively.
- **Image/video attachments.** trsl is a text-similarity/rewrite app — the
  model consumes text and produces text. Attachments have no mechanical
  path to translation quality here the way they would in an image-editing
  or video app (which is what the reference composer is actually from).
  Shipping them would be exactly the 80%-solved feature this taste rejects:
  a UI element with no corresponding quality improvement behind it.
- **The multimodal composer UI verbatim** (image chips, +, palette, Image/
  Video toggles, mic, send bar). One visual reference from a different
  category of app, not a spec. The one transferable idea — a one-tap
  preset row — is kept above; the rest is scope this app's use case doesn't
  need.

## Known consequences to carry forward (not blocking, name for critic/QA)
- A second free-text input is a second prompt-injection/abuse surface.
  The DECLINE guardrail today only exercises the message field; whether it
  needs to also scan context is critic's call at design time, not decided
  here. Related to the still-open backlog item on refusal-shaped-but-not-
  literal-DECLINE responses.
- Quality is measured qualitatively this iteration: before/after on a
  handful of real ambiguous messages (with vs. without context/tone),
  judged by whether the translated output reads like it's actually about
  what the sender meant. No automated eval harness — not warranted at this
  scale.

## Phase
Advances Phase 2 ("prove wife will pay") — specifically the "worth paying
into" half of that phase's dual goal, applied to output quality rather than
visual polish. See ROADMAP.md amendment below.
