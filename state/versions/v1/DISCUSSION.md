# v1 Discussion

## Objections

### 1. The app will launder threats and abuse into something that reads as kind — blocker
Nothing in the design stops a husband from typing something threatening,
degrading, or sexually coercive and getting back a "softened," presentable
version with a real shareable link attached to it, sent to a named real
person. That's not a hypothetical edge case — it's the exact use case a
tool called "raw unfiltered message -> sendable version" will attract from
its worst users, and it's precisely the pattern App Store trust & safety
flags: a tool whose job is to make abusive intent land smoother. "Translate"
succeeding on any input, no matter what's in it, is the actual product risk
here, not the paywall.

Fix: a minimal content check before translate — if the raw input contains
threats, sexual coercion, or self-harm language, the app declines to
translate (return an error/decline state, not a link) instead of
softening it. This is a guardrail on the existing LLM call, not a new
feature or a moderation pipeline. Add it to FINAL.md as a translate-step
requirement.

### 2. Permanent, publicly-readable, unauthenticated links to personal messages — blocker
DESIGN's own open question #3 flags this and answers itself with "obscure
random ID = enough," but that's not stated as a concrete requirement
anywhere in the spec — it's a hope. Two things follow from a page like this
existing forever with no auth: it can get crawled and indexed (now it's
googleable), and IDs that aren't explicitly high-entropy can drift toward
sequential/guessable during implementation with nobody catching it because
FINAL.md doesn't say otherwise.

Fix: two one-line requirements in FINAL.md, not new scope — `<meta
name="robots" content="noindex">` on the share page, and the share ID
must be a high-entropy token (e.g. UUID v4 / 128-bit), not sequential.
Both are already-planned work, just needs to be pinned down instead of left
to whoever's implementing it that day.

## Not objections (addressing DESIGN's open questions directly)
- Q1 (tonal direction/example pair): "honest but kind, not corporate, not a
  joke" plus a locked example pair is worth having, but it's a prompt-
  engineering nit, not a design blocker — engineer's call.
- Q2 (static og:image template): fine as proposed, don't build dynamic
  rendering for v1.
- Q4 (input char limit): not a blocker; sane default, engineer's call as
  DESIGN already proposes.
- Paywall: correctly out of scope per PRIORITY.md, not relitigating it here.

## Verdict: revise

Both objections are cheap, additive fixes to the translate step and the
share-page template that DESIGN already describes — nothing here changes
scope, adds a feature, or threatens shipping this iteration. But "ship
without them" means the first thing that goes wrong in public is either a
threatening message wearing a nice font, or a personal message showing up
in search results. Fold both into FINAL.md and this ships today as
designed.
