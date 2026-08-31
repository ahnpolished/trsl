# v5 Final

Folds in DISCUSSION.md's two blockers (DECLINE bypass on edited share text;
nested interactive elements inside `role="radio"`) and its accessibility
corrections (focus-ring contrast, hover-value contrast). Everything DESIGN.md
already had stands unless called out below as changed.

## Goal
Let the sender fix the AI's translated wording in place before sharing it,
and make the app look like something worth paying $1 for.

## User stories
Unchanged from DESIGN.md:
- As a husband, when a variant is 90% right, I can edit its text directly
  instead of re-rolling the AI and hoping, so I send exactly what I mean.
- As a husband, I still get a good AI draft by default and never have to
  type a translation from scratch — editing is optional, not a new mode.
- As a husband, if I mess up my edit, I can get back to the AI's original
  wording without starting over.
- As a wife receiving a link, the page I land on looks considered and
  finished, not like a bare form — because trusting the message means
  trusting the thing that delivered it too.

## Scope: in
- Selected variant's text becomes editable in place, pre-share.
- Edited text is what Share actually encodes as `translated` — subject to
  the server-side re-check below.
- `/api/share` re-runs the DECLINE check when (and only when) the submitted
  `translated` text differs from every variant in the batch that produced
  it. This is closing a bypass the edit feature introduces, not guardrail-
  accuracy work — same DECLINE prompt/threshold as today, just invoked on
  one more code path.
- A visual refinement pass over the existing app (home + share page),
  scoped as `polish` + `layout` + `typeset`.
- New standing tokens/patterns this pass introduces go into `agents/BRAND.md`.
- Card selection loses `role="radio"`/hand-rolled ARIA in favor of a native
  radio input + label (see ARIA fix below) — this is a mechanics change
  forced by the edit affordance, not new visual scope.

## Scope: out
- Prompt/output-quality rewrites (PRIORITY.md: "What this is not").
- DECLINE guardrail *accuracy* work — threshold, prompt wording, false-
  positive/negative tuning. Re-running the existing check on edited text is
  in scope; changing what the check considers a violation is not.
- A "write your own translation from scratch" mode.
- Editing the non-selected variants, or editing before a variant is
  selected.
- Any new visual world / rebrand.

## Editable translation draft — exact mechanics

**Where it lives**: only the *selected* card gets an edit affordance, same
as DESIGN.md.

**Affordance**: a small text link, `Edit`, bottom-right inside the selected
card, secondary-color (`#888`), visible only on the selected card.

**On tap**: the card's static text is replaced by a `<textarea>` in the
exact same box (same padding/radius/border/font-size), pre-filled with that
variant's AI text, `autoFocus`, cursor at end. No modal, no separate editor
screen.

**Locking in**: immediate, no confirm step. Whatever is currently in the
textarea *is* the pinned translated text at Share time (subject to the
DECLINE re-check below) — same as the raw-message composer's existing
behavior.

**Undo**: once a selected card has been edited (textarea value !== the
original AI variant for that index), a `Reset to AI draft` ghost-link
appears where `Edit` was, restoring the original variant text and
reverting the card to static display.

**Interaction with card selection**: switching to a different card while
mid-edit discards the in-progress edit of the card you're leaving, no
confirm. Re-selecting a previously-edited card later shows that variant's
plain AI text, not the discarded edit. Edits are transient, scoped to "the
card currently selected."

**Interaction with Regenerate**: unchanged from today — resets
`selectedIndex` to 0, replaces `translation` with a new batch, and any
in-progress/locked-in edit is discarded with the old variants.

**Character limit**: textarea inherits `MAX_CHARS` (1000), same as the raw
composer.

**Share button when the field is empty**: disabled when the selected
card's current text (edited or not) is empty/whitespace-only, matching the
existing `disabled={isBusy || !input.trim()}` pattern.

**Pinning discipline**: `sourceText` stays pinned at translate-time exactly
as v4 (untouched). The translated side: Share must read whatever text is
currently populating the selected card at the moment Share is pressed —
edited value if one exists, original AI variant otherwise — never a stale
snapshot. State shape (an edited-text value keyed to the current batch +
selected index, cleared on regenerate/selection-change) is engineer's call.

## Server-side DECLINE re-check on edited share text (blocker #1 fix)

**Why**: `app-trsl/src/lib/share.ts` documents that the DECLINE guardrail
"actually hold[s] on direct URL access too" because nothing reaches
`encodeShareId` without having survived `translateBatch`'s check first.
`POST /api/share` today only validates non-empty and under `MAX_CHARS` — it
does zero content moderation. Once the selected card is editable, whatever
the sender typed ships as `translated` with no check at all. This closes
that gap.

**Trigger condition**: the check runs *only* when the submitted `translated`
text (trimmed) does not exactly match any variant in the batch that
produced it. Unedited shares — the common case — pay zero extra latency or
API cost.

**The client cannot self-report "edited" — the server decides.** A
client-sent `wasEdited` boolean is not acceptable; a dishonest client would
reopen exactly the bypass this closes. `/api/share`'s request body must
therefore include the full variant batch (or the specific original variant
the selection came from) alongside `translated` and `original`, so the
server can diff itself. Exact shape (whole `variants: string[]` array vs.
just the one variant the selection pinned) is engineer's call; the
guarantee — server independently determines "was this edited," never trusts
a client flag — is not.

**What runs**: reuse `translate()` from `app-trsl/src/lib/translate.ts`
(the existing single-message function, already used for rewriting) called
on the submitted `translated` text. Only its `.declined` boolean is
consulted — **the rewritten/softened text `translate()` returns is
discarded**; on a pass, the user's edited text ships byte-identical, never
replaced by the model's own rewrite of it. This is reuse of existing
DECLINE logic, not new guardrail work.

**On decline**: `/api/share` returns an error response (same shape as the
existing validation-error responses in that route, `{error: string}` at an
appropriate 4xx status) and issues no share id. The client shows the
existing declined-state copy already used on the translate path (`page.tsx`
"This message can't be translated as written.") or copy equivalent to it —
and the sender's edit is preserved in the textarea so they can revise it,
not lost.

**Fail-closed on check error**: `translate()` can also return
`{ok:false, declined:false, error}` (missing API key, timeout, upstream
failure) — this is not the same as a pass. On this outcome `/api/share`
must not issue a share id; it returns an error response, same as a decline,
rather than falling back to trusting the unchecked text.

**`original` needs no re-check**: it's pinned at translate-time and already
passed the batch-generation DECLINE filter; only the `translated` side can
diverge from checked text via editing.

## ARIA fix: no focusable descendant inside radio semantics (blocker #2 fix)

**Why**: today's selected card is `role="radio"` with hand-rolled
`tabIndex`/`aria-checked`/`onClick`/`onKeyDown` (`page.tsx` ~line 275-296).
The edit affordance puts `Edit`, the `<textarea>`, and `Reset to AI draft`
inside that same element as DOM descendants — a radio widget isn't
expected to contain focusable descendants (breaks screen-reader
navigation), and a click on `Edit`/inside the textarea also bubbles to the
card's own `onClick={() => setSelectedIndex(index)}` with no
`stopPropagation`, giving undefined interaction behavior.

**Resolution**: drop the hand-rolled `role="radio"` pattern. Replace it
with a visually-hidden native `<input type="radio">` inside a `<label>`
wrapping the card's static content (text + `Edit` link), matching
`BRAND.md`'s existing "entire card is tappable" rule via the label's native
click-to-activate-input behavior — no `stopPropagation`, no manual
`tabIndex`/`keydown` handling needed, real radio semantics for free.

Constraints engineer must satisfy, exact markup shape is engineer's call:
- No element carrying radio semantics (the native `<input type="radio">`)
  ever has a focusable descendant. `Edit`, the textarea, and `Reset to AI
  draft` sit as siblings of the input, not children of a `role="radio"`
  container.
- When a card enters edit mode, the `<label>` must not end up wrapping the
  `<textarea>` — a label wrapping a focusable, independently-interactive
  control changes what activates the radio on click. The label wraps only
  the static-text state; in edit mode the textarea sits outside the label,
  visually in the same position.
- Clicking `Edit` or focusing/typing in the textarea does not change
  `selectedIndex` (no bubbling into the radio's change/click).
- Tab order is explicit and matches visual order: radio input (card) →
  `Edit`/`Reset` link → (when present) textarea.
- Whole-card tappability for *selection* (everywhere except the `Edit`
  link and, when present, the textarea) is preserved per `BRAND.md`'s
  existing "entire card is tappable" rule — this is not a scope change to
  that rule, just a markup change in how it's achieved.

`agents/BRAND.md`'s Layout section describes cards as `role="radio"`-
pattern only implicitly (via the "entire card is tappable" behavior, not
literal ARIA role text) — no BRAND.md wording change is needed for this
fix; it's a markup/mechanics change, engineer's territory per
product-designer's own boundary.

## Accessibility corrections (critic's note #3)

**Focus-visible ring — REPLACE, not ADD.** `app-trsl/src/app/globals.css`
already ships two focus-ring rules at `outline: 2px solid #4f46e5`:
`button:focus-visible` and `[role="radio"]:focus`. Both fail WCAG non-text
contrast (~2.78:1 against `#1a1a1a`, needs ≥3:1). Engineer must **overwrite
the color value in these existing rules to `#a5b4fc`** (~8.7:1) rather than
add a second, competing rule. Since the ARIA fix above removes
`role="radio"` from the card, `[role="radio"]:focus` becomes dead and must
be replaced with the equivalent selector for whatever element now carries
keyboard focus for card selection (e.g. the native radio input, or a
`:focus-within` on its label) — same `2px solid #a5b4fc` treatment, same
2px offset. This scope is **focus rings only** — the selected-card
`2px solid #4f46e5` *border* (a different rule, a different purpose:
persistent selection state, not transient keyboard focus) is unchanged,
and no other use of `#4f46e5` (accent buttons, borders) is touched.

**Hover value — fix the invisible one.** DESIGN.md's `#1f1f1f` hover
background for transparent/outline elements computes to ~1.06:1 contrast
against `#1a1a1a` surfaces — functionally invisible. Locked value:
**`#262626`** (a real, perceptible lift, still restrained/dark). This
replaces `#1f1f1f` everywhere DESIGN.md specified it — there is no other
in-scope use of that value.

## Visual direction (impeccable pass)

Unchanged from DESIGN.md except items 2 and the two corrections above.
Restating for completeness:

**Mode**: Operate — scanability and consistency over expression. No
marketing flourish, no hero imagery, no new visual world.

**Which impeccable commands**: `polish` + `layout` + `typeset` only.

1. **Spacing scale (missing token)**: `4 / 8 / 12 / 16 / 24 / 32 / 40`.
   Sectional gaps (composer → tone chips → context field → primary action
   → variant cards) 24-32px; within-group gaps 8-12px.
2. **Hover/focus states (missing token + accessibility gap)** — as
   corrected above: hover = 8% brightness lift on solid-fill elements, or
   `#262626` background on transparent/outline elements; focus-visible =
   `2px solid #a5b4fc` ring, 2px offset, **replacing** the existing
   `#4f46e5` focus rules (not stacking alongside them) on every focusable
   control (buttons, cards/card-selection element, chips, textarea, the
   new Edit/Reset links).
3. **Selected-card fill tint (one-off promoted to token)**: `#1c1a2e`
   background alongside the existing `2px solid #4f46e5` border. Instant,
   no transition.
4. **Wordmark weight**: `trsl` at weight 700, `-0.02em` letter-spacing,
   lowercase, no punctuation. No new typeface.
5. **Inline-edit pattern → BRAND.md**: same-box textarea swap, secondary
   text-link trigger (`Edit` / `Reset to AI draft`). Documented in
   BRAND.md's Layout section.

**Explicitly not touched**: palette hues, the three-moment motion budget,
the dark-only theme decision, the share page's structure beyond token
cascade.

## Resolved open questions (from DESIGN.md)

1. **`Reset to AI draft` placement/necessity**: resolved, keep it, as a
   position-swap with `Edit` (only one shows at a time). Critic agreed:
   immediate lock-in without a way back is a real regression for a
   fat-fingered edit. Not reopened.
2. **`#1c1a2e` selected-card tint derivation**: resolved, ship as specified
   — a judgment call, no contrast issue against `#eee` card text. Critic
   confirmed. Not reopened.
3. **Scope held to `polish`/`layout`/`typeset`, no `bolder`/`colorize`/
   `delight`**: resolved, hold the scope as designed. Critic agreed a
   bolder gesture on the share page specifically is a legitimate idea but
   a v6 call, not a reason to widen this increment.

## Acceptance criteria

Functional — edit/select/share mechanics:
- Selecting a card and tapping `Edit` replaces that card's static text with
  a pre-filled, focused textarea; the other two cards remain static.
- Typing in the textarea is unconstrained by any confirm/save step.
- A `Reset to AI draft` link appears once the textarea's value differs from
  the original AI variant, and clicking it restores the original text and
  returns the card to static display.
- Selecting a different card discards any in-progress edit on the card
  being left; re-selecting a previously-edited card shows its plain AI
  text, not the discarded edit.
- Regenerate clears all variants, all edits, and resets selection to index
  0, as it does today.
- The textarea enforces the same 1000-char cap as the raw composer.
- Share is disabled when the selected card's current text (edited or not)
  is empty or whitespace-only.
- `sourceText`/`original` pinning is unchanged from v4.

Functional — DECLINE re-check on edited share text:
- Submitting `translated` text that exactly matches (trimmed) one of the
  batch's original variants triggers zero additional model calls — the
  existing unedited-share path is unchanged in cost and latency.
- Submitting `translated` text that does not match any batch variant
  triggers a server-side DECLINE check before a share id is issued.
- The check trigger is determined server-side by diffing against the
  variant batch included in the request — not by trusting a client-
  reported "edited" flag.
- An edited message that trips DECLINE returns an error response, issues
  no share id, and the client shows declined-state copy while preserving
  the sender's edit in the textarea for revision.
- An edited message that passes the check ships as `translated` byte-
  identical to what the sender typed — never replaced by `translate()`'s
  own rewritten output.
- If the DECLINE check itself errors (timeout, missing key, upstream
  failure), no share id is issued — fails closed, same as a decline.
- `original` is not re-checked at share time (already covered by the
  translate-time batch check).

Functional — ARIA:
- No element carrying radio semantics for card selection has a focusable
  descendant (verified: `Edit`, `Reset to AI draft`, and the textarea are
  reachable in tab order but are not DOM descendants of the radio input).
- Clicking `Edit`, or focusing/typing into the textarea, never changes
  `selectedIndex`.
- Tab order is: radio input (card) → Edit/Reset link → textarea (when
  present), matching visual order.
- Whole-card click-to-select (outside the `Edit` link/textarea) still
  works, per BRAND.md's "entire card is tappable" rule.

Visual (checkable against updated `agents/BRAND.md`):
- Spacing between the composer, tone chips, context field, primary action,
  and variant cards uses the spacing scale — grouped elements closer than
  sectional breaks.
- Every interactive element (buttons, chips, cards/card-selection input,
  textarea, Edit/Reset links) has a visible hover state and a visible
  `:focus-visible` ring at `2px solid #a5b4fc`, 2px offset.
- `app-trsl/src/app/globals.css`'s prior `#4f46e5` focus-ring rules
  (`button:focus-visible`, the former `[role="radio"]:focus`) are
  overwritten to `#a5b4fc`, not left in place alongside a new rule — no
  focusable element has two competing focus-ring rules.
- The selected-card `2px solid #4f46e5` border is unchanged — only focus
  rings moved to `#a5b4fc`, not the selection-border color.
- Hover background on transparent/outline elements is `#262626`, not
  `#1f1f1f`.
- The selected variant card shows both the `2px solid #4f46e5` border
  *and* the `#1c1a2e` fill tint; unselected cards show neither.
- The `trsl` wordmark renders at weight 700 with `-0.02em` letter-spacing
  on both the home and share pages.
- No new animation moment was added outside the existing three-moment
  budget; the edit-textarea swap is instant, no transition.
- No color, font-family, card radius, or button shape outside what's now
  specified in `agents/BRAND.md` was introduced.

## Open questions
None. All resolved above.
</content>
