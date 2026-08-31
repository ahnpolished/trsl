# v5 Design

Re-derived directly from `state/versions/v5/PRIORITY.md`. The v5-draft
material that predated the rogue-subagent incident (old DESIGN.md/FINAL.md/
VISUAL.md, prompt-rewrite focused) is discarded as ground truth per
PRIORITY.md's own instruction — not reused here.

## Goal
Let the sender fix the AI's translated wording in place before sharing it,
and make the app look like something worth paying $1 for.

## User stories
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
- Edited text is what Share actually encodes as `translated`.
- A visual refinement pass over the existing app (home + share page),
  scoped as `polish` + `layout` + `typeset` per the impeccable skill's own
  command vocabulary — restraint, not a new visual world.
- New standing tokens/patterns this pass introduces get written into
  `agents/BRAND.md`, not left as one-offs in this doc.

## Scope: out
- Prompt/output-quality rewrites (PRIORITY.md: "What this is not").
- DECLINE guardrail work (PRIORITY.md: "What this is not").
- A "write your own translation from scratch" mode. The AI draft is always
  what populates the field; there is no blank composer for the translated
  side.
- Editing the non-selected variants, or editing before a variant is
  selected.
- Any new visual world / rebrand. This is refinement of the incumbent
  identity in `agents/BRAND.md`, not a replacement (impeccable: "Refinement
  preserves; redesign replaces" — this is refinement).

## Editable translation draft — exact mechanics

**Where it lives**: only the *selected* card gets an edit affordance. The
two unselected variants stay static text — you pick a draft, then you can
refine it; editing before picking one has no target and would break the
"select one of three" mental model `agents/BRAND.md` already establishes.

**Affordance**: a small text link, `Edit`, bottom-right inside the selected
card, secondary-color (`#888`), visible only on the selected card. Not an
icon-only pencil — `agents/BRAND.md`'s voice section rules out anything
that needs decoding, and a text label costs nothing here.

**On tap**: the card's static `<p>` is replaced by a `<textarea>` in the
exact same box (same padding/radius/border/font-size as the card — it reads
as "the same text became typeable," not as a new element appearing),
pre-filled with that variant's AI text, `autoFocus`, cursor at end. No modal,
no separate editor screen.

**Locking in**: immediate, no confirm step. Whatever is currently in the
textarea *is* the pinned translated text at Share time — same as how the
raw-message composer already works today (v1-v4 precedent, no new mental
model). There is no explicit "save" action.

**Undo**: once a selected card has been edited (textarea value !== the
original AI variant for that index), a small `Reset to AI draft` ghost-link
appears next to `Edit`'s former position, restoring the original variant
text and reverting the textarea back to static display. This is the escape
hatch that immediate-lock-in requires — without it, a bad edit has no way
back except retyping from memory.

**Interaction with card selection**: switching to a different card while
mid-edit discards the in-progress edit of the card you're leaving (no
confirm — this matches `agents/BRAND.md`'s existing "selection state swaps
instantly, no transition" rule for these cards; an edit is cheap to retype
and the stakes of losing an in-place, not-yet-shared edit are low). Coming
back to a previously-edited card later in the same batch does **not**
restore the edit — it shows that variant's plain AI text again. Edits are
transient, scoped to "the card currently selected," not persisted per index.

**Interaction with Regenerate**: Regenerate already resets `selectedIndex`
to 0 and replaces `translation` with a brand-new batch (existing v1-v4
behavior, unchanged). Any in-progress or locked-in edit is discarded along
with the old variants — a new AI batch means a new starting draft, no
partial carry-over. No new confirmation dialog for this; it's consistent
with what Regenerate already does to selection state today.

**Character limit**: the textarea inherits the same `MAX_CHARS` (1000) cap
as the raw composer — one message-length rule for the app, not two.

**Share button when the field is empty**: if the user edits the textarea
down to nothing (or whitespace-only), Share is disabled, matching the
existing `disabled={isBusy || !input.trim()}` pattern already used for
Translate. An empty translated message is never a valid share.

**Pinning discipline (hard constraint, must not regress v4's fix)**: v4
pins `sourceText` at translate-time specifically so Share never reads a
possibly-edited composer. That fix is untouched — `sourceText` stays pinned
exactly as today. The *new* rule for the translated side, symmetric in
spirit: Share must read whatever text is currently populating the selected
card at the moment Share is pressed — the edited value if one exists, the
original AI variant otherwise — never a stale snapshot taken earlier, and
never silently falling back to the array value once an edit exists. Engineer
implements this as state (e.g., an edited-text value keyed to the current
translation batch + selected index, cleared on regenerate/selection-change
per the rules above); the exact state shape is engineer's call, the
guarantee above is not.

## Visual direction (impeccable pass)

**Mode**: Operate. The visitor is completing a task (compose → pick →
refine → share), not being persuaded or shown a portfolio — per impeccable's
mode guidance, that means scanability and consistency outrank expression.
This bounds the pass: no marketing flourish, no hero imagery, no new visual
world.

**Which impeccable commands apply, and why**: `polish` (whole-path
refinement against the existing system) + `layout` (spacing/rhythm) +
`typeset` (hierarchy). Not `bolder`, not `overdrive`, not a `new-work` reset
— PRIORITY.md is explicit this is a refinement of "v1-v4 shipped no design
investment," not a replacement identity, and impeccable's own routing
(`context.mjs`) confirms a scoped refinement of existing code proceeds on
the incumbent implementation without requiring PRODUCT.md/init first.

**What's changing, concretely, and why** (per polish.md's own triage:
missing token / one-off implementation / conceptual mismatch / local
defect — classifying each below):

1. **Spacing is ad hoc → formalize a scale (missing token).** Today's
   margins are one-off pixel values chosen per element (4, 8, 12, 16, 20,
   24 all appear with no system). Add a spacing scale to `agents/BRAND.md`:
   `4 / 8 / 12 / 16 / 24 / 32 / 40`. Apply it so major sections (composer →
   tone chips → context field → primary action → variant cards) get more
   air between *groups* (24-32px) while elements *within* a group (a card's
   internal padding, a chip row) stay tight (8-12px) — this is the
   "group tightly, separate generously" instinct the current flat 12px-
   everywhere rhythm doesn't express. This is the single biggest lever for
   "looks considered" without touching color or type.

2. **No hover/focus states anywhere → add them (missing token, and an
   accessibility gap).** `agents/BRAND.md` currently specifies only default
   and selected states for buttons/chips/cards. There is no hover, no
   focus-visible ring, on any interactive element. Add both as standing
   tokens: hover = 8% brightness lift on solid-fill elements, or `#1f1f1f`
   background on transparent/outline elements; focus-visible = `2px solid
   #a5b4fc` ring, 2px offset, on every focusable control (buttons, cards,
   chips, textarea, the new Edit/Reset links). This is a floor-level gap,
   not a taste call — no interactive element should be indistinguishable
   from static content to a keyboard or pointer-hover user.

3. **Selected card looks identical to a hover state, just a border change →
   add a fill tint (one-off implementation, promoted to a token).** A
   2px border alone is a subtle signal for the highest-stakes selection in
   the flow (this literally becomes what gets sent). Add a selected-card
   background tint: `#1c1a2e` (accent-indigo mixed into the card's dark
   base at low opacity) alongside the existing border treatment. Border
   change stays instant, no transition — consistent with the existing "a
   quick input, not a reveal" rule.

4. **Wordmark is flat, no weight contrast (local defect against the
   product's own stated ambition).** Bump `trsl` to weight 700 with tight
   letter-spacing (`-0.02em`); keep it lowercase, no punctuation, per
   existing voice rules — just give it enough presence that the one page
   users share links from doesn't read as a placeholder. Small, one-line
   change, not a new typeface (BRAND.md's system-font rule is unchanged
   and correct — restraint over a branded font no one asked for).

5. **Inline-edit affordance is a genuinely new pattern → specify and add
   to BRAND.md**, not just this doc: a card that swaps static text for a
   same-box textarea on demand, with a secondary text-link trigger
   (`Edit` / `Reset to AI draft`) is reusable beyond this one screen (it's
   the shape any "let the user touch AI output" moment in this app will
   take). Documented in BRAND.md's Layout section as the "inline edit"
   pattern.

**Explicitly not touched**: palette hues, the three-moment motion budget
(no new animation moments added — the textarea swap is a state change, not
a reveal/unlock/confirmation moment, matching how card selection is already
exempted from motion), the dark-only theme decision, the share page's
existing structure beyond whatever the above tokens cascade into it.

**BRAND.md updated in this same pass** — see diff to `agents/BRAND.md`:
new Spacing section, new hover/focus rows under Layout, selected-card fill
token, and the inline-edit pattern.

## Acceptance criteria

Functional:
- Selecting a card and tapping `Edit` replaces that card's static text with
  a pre-filled, focused textarea; the other two cards remain static.
- Typing in the textarea is unconstrained by any confirm/save step — the
  live value is what Share will send.
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
- `POST /api/share`'s `translated` field always equals the selected card's
  current live text (edited value if present, else the original AI
  variant) at the moment Share is pressed — never a stale value.
- `sourceText`/`original` pinning behavior is unchanged from v4 (still
  pinned at translate-time, never re-read from the composer at share-time).

Visual (checkable against `agents/BRAND.md` post-update):
- Spacing between the composer, tone chips, context field, primary action,
  and variant cards uses the new spacing scale — grouped elements closer
  than sectional breaks.
- Every interactive element (buttons, chips, cards, textarea, Edit/Reset
  links) has a visible hover state and a visible `:focus-visible` ring
  using the token values specified above.
- The selected variant card shows both the `2px solid #4f46e5` border
  *and* the `#1c1a2e` fill tint; unselected cards show neither.
- The `trsl` wordmark renders at weight 700 with `-0.02em` letter-spacing
  on both the home and share pages.
- No new animation moment was added outside the existing three-moment
  budget; the edit-textarea swap is instant, matching card selection's
  existing "no transition" rule.
- No color, font-family, card radius, or button shape outside what's now
  specified in `agents/BRAND.md` was introduced.

## Open questions for critic
1. The `Reset to AI draft` link: I've placed it as replacing `Edit`'s
   position once dirty (so only one link shows at a time). If critic reads
   PRIORITY's "editing optional, zero extra taps" as meaning *no* new UI
   chrome should appear post-edit at all, that's a real disagreement to
   flag now — I think a reset path is required once we commit to no-confirm
   editing, but it's worth a second opinion given the "cost nothing for
   senders who don't need it" bar.
2. Selected-card fill tint (`#1c1a2e`) is a new color derived from mixing
   the accent into the card background, not a literal existing BRAND.md
   value — flagging the exact hex as a judgment call or check contrast if
   critic wants a harder derivation rule.
3. I scoped the visual pass to polish/layout/typeset and explicitly left
   out `bolder`/`colorize`/`delight`. If critic thinks v1-v4's "no design
   investment" gap needs one of those (e.g., a bolder gesture on the share
   page specifically, since that's the one surface a non-user — the wife —
   actually sees), that's a scope call worth raising before FINAL.md locks
   it out.
</content>
