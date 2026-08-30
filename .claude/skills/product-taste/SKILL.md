---
name: product-taste
description: Use when acting as product-designer (drafting/finalizing a version, or the demo round), pm (the demo round), or critic (DISCUSSION.md or the demo round) and a judgment call needs more than "does this match the spec" -- does this feature actually change user behavior, and is it accessible/usable by the checkable standards we can verify without a testing panel we don't have. Distilled from three community skills (see agents/SKILL-EVAL.md for the full dissection); adopts three narrow things from them, not their full scope.
---

# Product taste: behavioral lens + accessibility checklist

Two tools, used at different points in the loop. Neither replaces
`agents/BRAND.md` (the visual token source of truth) or `agents/TASTE.md`
(each persona's named reference) — this skill is additive, for the specific
gaps neither covers.

## 1. Behavioral lens (pm: PRIORITY.md and the demo round)

Before scoping or judging an increment, ask: **what specific user behavior
is this meant to change, and by what actual mechanism?** "Users will like it
more" is not a mechanism. Check against these (each has a stated
why-it-works, not just a label — cite the mechanism when you use one):

- **Loss aversion** — people work harder to avoid losing something they
  already have than to gain the equivalent. trsl example: the unlock reveal
  (v2) already uses this shape (a receiver who's seen the translated text
  has *something* — the original is framed as what they'd be missing, not
  a cold feature pitch). Ask: does this increment give the user something
  they'd feel they were losing by not engaging further?
- **First-use friction is disproportionately costly** — a bad first
  experience predicts abandonment far more than an equivalent bad experience
  later, because there's no accumulated investment yet to offset it. Ask:
  does this increment add or remove a step between intent and the core
  value moment (raw message → real relief of sending it)?
- **Mounting value** — a product that gets more valuable the more it's used
  creates a real switching cost, not an artificial one. Ask: does this
  increment make trsl something the user would have *more* to lose by
  abandoning, or is it a one-off use with no compounding?
- **Don't manufacture urgency that isn't real** — streaks/loss-aversion
  mechanics are legitimate when they reflect real accumulated value (per
  above); they're a dark pattern when they simulate loss that isn't actually
  there. This is where pm's mechanism hands off to critic's trust-and-safety
  lens — flag it, don't resolve it here.

Write the mechanism (or the explicit absence of one — "this doesn't change
behavior, it's a quality-of-life fix, and that's fine") into PRIORITY.md or
the demo round's DEMO.md entry. A feature with no identifiable behavioral
mechanism isn't automatically wrong — but say so plainly instead of
asserting impact you can't name.

## 2. Accessibility + heuristic checklist (critic: DISCUSSION.md, demo round)

The only piece of the borghei product-designer skill that's checkable
without infrastructure trsl doesn't have (no user-testing panel, no SUS
scores yet — those stay out of scope until real usage exists). Run this
against the actual built thing (preview deploy in the demo round; the
design intent in DISCUSSION.md):

- **Contrast** — 4.5:1 minimum for text against its background. Check
  `agents/BRAND.md`'s actual palette pairs, don't eyeball it.
- **Focus indicators** — every interactive element (buttons, inputs) has a
  visible focus state, not just a hover state. Keyboard-only use should be
  possible.
- **Feedback on every action** — per BRAND.md's motion section: does
  tapping something show it registered (loading/processing/confirmation
  state), or can a user tap into silence and not know if it worked?
- **Nielsen's "visibility of system status" and "error prevention"** — two
  of the ten heuristics worth naming explicitly here since they're the ones
  most likely to actually bite a two-screen app: does the user always know
  what state they're in (translating / locked / unlocked / error), and does
  the UI stop a clearly-bad action before it happens (e.g. the 1000-char
  cap should block submission, not just fail server-side after the tap)?

This is a checklist, not prose — DISCUSSION.md or DEMO.md should state
pass/fail per item, same discipline as QA.md's table, not a paragraph of
vague impressions.

## Clarify-first discipline (any persona, any stage)

Borrowed directly: before producing a deliverable, if there's a genuine
unknown that would change the output, ask — don't assume. But cap it: only
the 1-3 questions that would actually change what you produce, then proceed
with assumptions stated up front rather than stalling on more questions.
This matches how the loop already runs (PM's one pick, critic's one round,
designer's finalize-not-endless-negotiation) — it's the same discipline
applied to "should I ask a clarifying question right now," not a new
process.

## What's deliberately not adopted

No Python scoring scripts, no 5-day sprint calendar, no journey-map/card-sort
templates, no Figma/Maze/Dovetail integrations, no image-to-token derivation
workflow, no dual `.md`/`.html` mirror file. See `agents/SKILL-EVAL.md` for
why each was cut — mainly: no dependency for it exists yet (real user
testing, a design tool), or it would duplicate `agents/BRAND.md` /
`agents/TASTE.md` instead of extending them.
