# v5 Priority

## Item
Two increments, scoped tight for a same-day ship:
1. **Editable translation draft** — the sender can revise the AI's
   translated output (the variant they selected) before it's locked into a
   share link. AI draft stays the default; editing is an escape hatch, not
   a "write both from scratch" pivot.
2. **Visual redesign pass** via the `impeccable` skill, coordinated with
   product-designer's ownership of `agents/BRAND.md`.

No prompt-rewrite work this iteration (see "What this is not," below) and
no DECLINE guardrail work (see backlog — real open risk, explicitly
deferred again by direct product-owner instruction, same as v4).

**Two items, not one — a deliberate exception to "pick one."** This
persona's normal discipline is a single pick per iteration; two items here
because the product owner directed both, in stated priority order
(editable draft above visual redesign), not because either is optional.
If the day runs short: editable draft ships. The visual pass ships
complete or slips whole to v6 — not partially applied. An 80%-finished
redesign is a failed redesign per this persona's own standard, and
`impeccable`'s own cycle (build fully, inspect once, fix in one batch,
confirm, stop) is a unit of work to complete or not start, not a progress
bar to freeze mid-pass. **Not from the
backlog**: backlog.md's current v5 candidate line ("OG-image-as-delivery")
is superseded for this iteration by this direct instruction — flagging
that per this persona's remit to say when a pick doesn't come from the
backlog, not editing backlog.md itself (that's reviewer's file).

## Scope clarification: what v4 already shipped vs. what's actually new here

This needed checking before scoping, because "editable composer" is
already in v4's FINAL.md and it would be wasted work to re-ship it.
Verified against `app-trsl/src/app/page.tsx`:

- v4's editable composer is the **raw-message textarea** (`input` state,
  line ~163) — the sender edits their unfiltered draft *before* translation
  runs. This has existed since v1; v4 just added variants/regenerate on
  top of it. FINAL.md's v4 scope explicitly lists "Inline editing of a
  generated variant" under **Scope: out** — confirmed by reading the code:
  the selected variant renders as static text (`{variant}`, line ~294),
  never as an editable field.
- So the sender today has no way to touch the *translated* text at all —
  only pick from 3 AI variants or regenerate. If none of the 3 quite lands
  (a wrong name, a phrase that's too soft, a detail the AI dropped), the
  only recourse is regenerate-and-hope.
- **v5's item is specifically: make the selected variant's text editable
  in place, post-selection, pre-share.** The AI draft still populates the
  field by default (no blank-slate pivot, no "type it yourself" mode) —
  editing is optional and the Share action just sends whatever text is
  currently in the field, edited or not.

## Why this, why now
Phase 2's north star is "does the reveal feel worth $1" — which depends on
the sender trusting the *translated* message enough to send it in the
first place. Right now, if a variant is 90% right, the sender's only lever
is regenerate (another full AI pass, no guarantee of getting closer) or
shipping something slightly wrong. That's a real gap between "AI picked
words" and "this is actually what I want to say," and it's the single
highest-stakes moment in the flow — the one right before an unrecoverable,
public share link goes out.

**Behavioral mechanism** (product-taste skill): this is a first-use/
high-stakes-moment friction fix, not a loss-aversion or mounting-value
play. The share action is irreversible and public — a sender who isn't
fully confident in the exact wording is the sender most likely to abandon
at the last step rather than send something they didn't really mean. An
in-place edit removes the single largest reason to bail right before
commit, and it costs nothing for senders who don't need it — the AI draft
is still there, still the default, zero extra taps unless they choose to
use it. This is a friction-removal mechanism, not a persuasion one.

The visual redesign doesn't have its own behavioral mechanism beyond what
ROADMAP.md Phase 2 already states: the product has to *feel* worth paying
into, and v1-v4 have been "no design investment" / functionally-complete-
but-plain per prior RETRO.md entries. That's a credibility/trust-signal
job, not a discrete behavior-change lever — naming that plainly rather
than inventing one.

## What this is not
- **Not** the v5-draft material that predates this scoping (`DESIGN.md`,
  `FINAL.md`, `VISUAL.md` etc. currently in this directory) — those were
  produced before the rogue-subagent incident (see v4/RETRO.md) was caught
  and are unverified. They cover natural-brevity prompt rewrites and some
  UI/focus-state work; product-designer should treat them as draft
  reference only, not as this iteration's ground truth, and re-derive
  DESIGN.md against *this* PRIORITY.md.
- **Not** a prompt rewrite for tone/brevity. That was the old draft's
  whole premise; it isn't in this iteration's product-owner direction and
  duplicates part of what editable-draft now covers anyway (a sender who
  can fix the wording no longer needs the prompt to be perfect on the
  first try).
- **Not** DECLINE guardrail threat-detection work. Real, logged, accepted
  risk from v4 (`state/versions/v4/RELEASE.md`, backlog.md, top of the
  backlog) — explicitly deferred again this iteration by direct
  product-owner instruction. Still first-priority backlog item, still not
  closed, just not this increment.

## Constraints (product-designer details the actual UX in DESIGN.md/FINAL.md)
- The selected variant's text must become editable pre-share — how
  (inline field, modal, etc.) is product-designer's call, not dictated
  here.
- Whatever text Share actually sends is what gets encoded — same pinning
  discipline v4 already established for source-text (never silently pair
  edited output with the wrong raw input). This is a hard constraint, not
  a UX preference.
- Visual pass runs through the `impeccable` skill (direct product-owner
  instruction — not optional), coordinated with product-designer's
  ownership of `agents/BRAND.md`. No `PRODUCT.md`/`impeccable` config
  exists yet in this repo; per the skill's own routing, that does not
  block a refinement of an existing surface — the incumbent
  implementation and `agents/BRAND.md` already serve as the visual-truth
  input, `init` can run alongside if product-designer wants it on record.
  This is a refinement pass (v1-v4 shipped "no design investment" per
  prior RETRO.md entries), not a replacement visual world — likely
  `audit`/`critique`/`polish` territory, product-designer's call which
  impeccable commands actually apply. The skill's own discipline (build
  once, inspect once in a batched round, fix once, confirm once, stop) is
  bounded by design, which is why it fits inside a tight-scope same-day
  iteration rather than being an open-ended process risk.

## Explicitly out
- Real Stripe integration (still not this phase's job — mock paywall
  stands).
- Prompt/output-quality rewrites (see "What this is not").
- DECLINE guardrail accuracy work (see "What this is not").
- A full "write your own translation from scratch" mode — AI draft stays
  default; this is edit-in-place, not a parallel authoring path.

## Phase
Advances ROADMAP.md Phase 2 ("prove wife will pay") on two of its three
stated legs at once: the visual bar (explicitly named) and, newly, sender
trust in the translated output as a precondition for sending it at all —
which the output-quality leg assumed would come from prompt work alone,
and turns out to also need a correction path when the AI doesn't nail it.
No phase change — Phase 2 still open, this is squarely inside it.
