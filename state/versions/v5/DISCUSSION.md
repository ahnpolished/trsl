# v5 Discussion

## Objections

### 1. [BLOCKER] Edit affordance opens a proven DECLINE bypass — not a hypothetical

`app-trsl/src/lib/share.ts` says this outright, in its own header comment:

> "This is what makes the DECLINE guardrail (enforced only in the translate
> route, which is the only place encodeShareId is called) actually hold on
> direct URL access too."

That is the codebase's own documented security invariant: `translated` is
safe to encrypt and hand out as a link because the only thing that ever
reaches `encodeShareId` is text that already survived `translateBatch`'s
DECLINE check. `POST /api/share` (`app-trsl/src/app/api/share/route.ts`)
does zero content moderation of its own — it validates non-empty and
under `MAX_CHARS`, nothing else. The whole system leans on "nothing gets
here without having been through the guardrail first."

DESIGN.md's edit affordance breaks exactly that assumption. Once a card is
editable, whatever's in the textarea at press-time — not the AI's
DECLINE-checked output — is what `handleShare` sends as `translated`. A
husband can now type literally anything into the selected card (a threat,
coercive language, anything the guardrail exists to catch) and Share
encrypts and issues a link for it with no re-check. This isn't a re-tuning
question (out of scope, correctly) — it's "does the check run *at all* on
the text that actually ships," which is a structural gap the edit feature
introduces, not an accuracy question about where the line is drawn.

This is the wife/T&S lens directly: she receives a link whose content was
never screened, from an app whose entire pitch to her is "this was
softened." An abusive edit slipping through a delivery mechanism whose own
source comments claim it can't happen is worse than not having tried.

**Fix, buildable in one increment, no guardrail-tuning required:** re-run
the existing single-message DECLINE check (`translate()` in
`app-trsl/src/lib/translate.ts` already has this logic, just reused for
rewriting rather than classification) server-side in `/api/share`,
*only* when the submitted `translated` differs from the original AI
variant that produced it — i.e. only on the edited path, so the
unedited/common case pays no extra latency or API cost. Practically:
`/api/share` needs to know both the edited text and the original variant
it diverged from (client already has both — `translated` plus the
variant array/index) to decide whether a check is owed; if the client
can't be trusted to report "yes this was edited" honestly, the server can
just diff `translated` against the batch's variants itself. Same DECLINE
prompt/threshold as today — this is closing a bypass path, not moving
the guardrail-accuracy goalposts DECLINE work is fenced off from this
iteration.

### 2. [BLOCKER] Edit/Reset controls nest interactive elements inside `role="radio"` — breaks the existing accessible pattern

Current code (`page.tsx` line ~275): each card is `role="radio"
tabIndex={0}` with its own click/keydown handling — the ARIA radio pattern
assumes a radio item's only interaction is "select me," nothing nested
inside it is separately operable. DESIGN.md's `Edit` link, the swapped-in
`<textarea>`, and the `Reset to AI draft` link all live "bottom-right
inside the selected card" — i.e., as DOM descendants of that same
`role="radio"` div.

Concretely this breaks two things DESIGN.md doesn't address:
- **Screen reader semantics**: a radio widget isn't expected to contain
  focusable descendants; AT users tabbing through a radiogroup won't get
  a sane announcement for a link/textarea nested inside one radio item,
  and the container's own `tabIndex=0` plus the nested elements'
  `tabIndex` create two separate stops to reach content that reads as one
  card.
- **Click bubbling**: clicking `Edit` (or typing into the textarea) is a
  click inside the card, which the card's own `onClick={() =>
  setSelectedIndex(index)}` will also receive unless something stops
  propagation — undefined behavior DESIGN.md doesn't specify.

This is a floor-level accessibility break on the highest-stakes UI in the
flow (this is the card that becomes the share), not a nice-to-have. Fix
is small: either the Edit/textarea/Reset cluster needs `stopPropagation`
plus an explicit accessible-name/focus-order pass, or — cleaner — drop
`role="radio"` off the div containing them once it can contain a form
control, and give the selection click-target its own smaller
element/overlay instead of the whole card. Either is a same-increment
fix; DESIGN.md just needs to say which, since it currently doesn't
mention the conflict at all.

### 3. Accessibility spec is real, not just gap-naming — with one inaccurate framing to correct

The good news, since this was explicitly in scope: the hover/focus spec
in DESIGN.md item 2 gives actual values (hover: 8% lift or `#1f1f1f`;
focus-visible: `2px solid #a5b4fc`, 2px offset) applied to every
focusable control — that's a real fix, not "TBD, will add later."

But the framing "no hover, no focus-visible ring... on any interactive
element" is factually wrong against the current code:
`app-trsl/src/app/globals.css` already ships `button:focus-visible` and
`[role="radio"]:focus` rings at `2px solid #4f46e5`. The good news buried
in that: the existing ring color actually **fails** WCAG non-text
contrast against the `#1a1a1a` card background (~2.78:1, needs ≥3:1) — so
DESIGN.md's proposed `#a5b4fc` (~8.7:1) is a genuine, needed fix, just
framed as "adding" something that needs to be "replaced." Say so
explicitly so engineer overwrites the existing rule instead of stacking a
second, conflicting one.

Separately, minor: the `#1f1f1f` hover value for outline/transparent
buttons computes to roughly 1.06:1 luminance contrast against the
`#1a1a1a` surfaces those buttons sit on — functionally invisible, which
undercuts the stated goal ("no interactive element indistinguishable from
static content to a... hover user"). Not a blocker, but pick a value with
an actual perceptible delta (e.g. `#262626`+) before calling this fixed.

## Non-blocking notes / answers to open questions

1. `Reset to AI draft` as a required escape hatch for no-confirm editing:
   agree, keep it. Immediate lock-in without a way back would be a real
   regression for a husband who fat-fingers an edit right before sending.
2. `#1c1a2e` selected-card tint: fine as a judgment call, no contrast
   issue against existing `#eee` card text.
3. Scoping to `polish`/`layout`/`typeset` only, holding off `bolder`/
   `colorize`/`delight`: agree — the share page (the one surface the wife
   actually sees) could earn more later, but that's a v6 call, not a
   reason to hold this increment.
4. The pinning-rule mechanics for the *edited-text* side (state keyed to
   batch+index, cleared on regenerate/select-change, never falling back
   silently to the array once an edit exists) are correctly specified and
   don't reopen v4's composer/share mismatch bug class on their own — the
   only sharp edge is objection #1 above (what text is allowed to reach
   Share at all), not which text Share reads.

## Verdict

**revise** — objections #1 and #2 are blockers. Both are small, same-
increment fixes (reuse existing DECLINE logic on the edited path only;
resolve the nested-interactive-in-radio-role conflict), not scope
expansions — this doesn't require reopening DECLINE accuracy work or the
visual pass to land correctly.
</content>
