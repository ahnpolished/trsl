# v3 Final

## Goal
Give the sender a way to hand the model what it's missing — who this is
for and what tone they're going for — so the translation actually lands on
what they meant, instead of a generic softened guess.

## User stories
- As a sender, I can optionally add a line of context ("telling my
  roommate I'm moving out") so the translation is about my actual
  situation, not a blind guess.
- As a sender in a hurry, I can tap one tone chip ("Direct but kind")
  instead of typing anything, and get a translation shaped by it.
- As a sender who wants neither, I can ignore both and get exactly
  today's experience — one textarea, one button, nothing new in the way.
- As a receiver, I see the same `/m/[id]` I always have — nothing about
  the sender's context or tone choice ever reaches me.

## Behavioral mechanism (confirmed carried through, per pm's PRIORITY.md)
PRIORITY.md frames this as a precondition of Phase 2's "worth paying into"
goal, applied to output quality: the $1 unlock has nothing worth paying
for if the translation itself is off-target. That's not a standalone
behavioral mechanism in the loss-aversion/first-use-friction/mounting-value
sense from `product-taste` — PRIORITY.md doesn't claim one, and this
increment is honestly a quality-of-life fix to the core translate path,
not a new behavior driver. Checked against the three mechanisms:
- Not loss aversion — nothing here is framed as something the user would
  lose by not engaging.
- Not first-use friction reduction directly — it adds two optional
  elements to the composer, though both are inert by default (zero added
  steps if ignored), so it doesn't add friction either.
- Closest fit is **mounting value indirectly**: better-targeted
  translations make each use more likely to produce something the sender
  actually sends, which is the precondition for the unlock mechanic (v2)
  to have anything real to protect. It's downstream of Phase 2's mechanism,
  not a new one of its own.
This is stated explicitly rather than inventing a mechanism PRIORITY.md
never claimed — pm's reasoning survives into this design as "precondition
for Phase 2 to work," not as a new behavioral hook, and that's the correct
scope for this item.

## What it looks like
Below the main textarea, one row of tone chips (horizontal, wrap on
narrow screens) — no label needed, they're self-explanatory:

**Gentle · Direct but kind · Playful · Just being honest · Setting a
boundary**

Five, not six — "apology" and "gentle" cover the same ground, cut one.
Tapping a chip toggles it selected (tap again to deselect); at most one
selected at a time, since the prompt is grounding tone in a single
direction, not blending two. Selected state is a filled/outlined style
swap, nothing heavier.

Under the chip row, a single-line text input, collapsed to a placeholder
by default: `+ Add context (who it's to, what happened)`. It's a real
input, not a modal trigger — clicking it just puts your cursor in it and
it's already there, no expand animation, no second screen. Cap at 200
chars, small counter appears only once you start typing (matches the
existing textarea counter pattern). No label, no required marker — it
reads as an offered extra, not a form field.

Both are optional and independent: chip alone, text alone, both, or
neither. Nothing about them changes the button's enabled state — that's
still governed by the main textarea having content, exactly as today.

## Visual direction
Everything below is a direct application of `agents/BRAND.md`'s existing
tokens — no new colors, no new type sizes. One new motion/interaction
pattern is needed (chip selection state) and is added to BRAND.md in this
same pass (see "BRAND.md addition" below).

- **Placement**: chip row sits directly below the existing textarea's
  char counter, with the same 12px gap the counter currently has above
  the Translate button (`marginTop: 12` on today's button becomes the gap
  above the chip row instead; button gap becomes `marginTop: 12` again
  below the context input). Order top to bottom: textarea → counter →
  chip row → context input → Translate button. Total added vertical
  space before the button: chip row + context input + two 12px gaps —
  keep it tight, this is a composer, not a form.
- **Chip styling**: reuses BRAND.md's secondary-button treatment
  (transparent fill, `#4f46e5` accent border, `#eee` text, 8px radius) for
  unselected chips. Selected state uses BRAND.md's primary-button fill
  (solid `#4f46e5` background, `#fff` text) — this is the same
  solid-vs-outline vocabulary BRAND.md's Buttons section already defines
  for primary/secondary, just applied at chip scale instead of full-width.
  Chip padding: `6px 12px`, font-size 14px (below body-text range,
  appropriately since these are labels not content), gap between chips
  8px, row wraps via flexbox on narrow screens. No shadow, per BRAND.md.
- **Context input**: same visual treatment as the existing textarea —
  `#1a1a1a` background, `1px solid #333` border, 8px radius, `#eee` text,
  12px padding — but single-line height (`padding: 10px 12px`, no
  `resize`). Placeholder text uses BRAND.md's secondary text color
  (`#888`), matching how the existing textarea's placeholder already
  reads. Char counter below it: identical style to the existing counter
  (`fontSize: 12, color: #666, textAlign: right`), but only rendered once
  `context.length > 0` (resolves DESIGN.md's "counter appears only once
  you start typing" — implemented as a conditional render, not
  opacity/visibility, since there's nothing to animate in).
- **Motion**: no new reveal/transition needed. Chip selection is an
  instant style swap (no transition), consistent with BRAND.md's existing
  rule that only reveal/unlock/confirmation moments get animation — a
  chip tap is not one of those three, so it should feel immediate, not
  precious. The context input has no expand/collapse animation, per
  DESIGN.md's explicit call ("no expand animation, no second screen") —
  this is already covered by BRAND.md's general restraint principle, no
  new addition needed for it.
- **Focus states**: both the chip buttons and context input get the
  browser's native focus ring (do not suppress `outline` — no CSS reset
  currently strips it on the existing textarea/button either, confirmed
  by reading `page.tsx`; new elements must not regress this). Required
  for keyboard-only usability per `product-taste`'s accessibility
  checklist.
- **Contrast check** (per `product-taste` checklist, against BRAND.md's
  actual pairs): `#eee` on `#1a1a1a` and `#fff` on `#4f46e5` both clear
  4.5:1 (inherited from existing button/card pairs, already in use
  elsewhere in the app — not re-derived here). Placeholder `#888` on
  `#1a1a1a` is ~4.6:1, consistent with the existing textarea placeholder
  already shipping today — no regression, no new pair introduced.

### BRAND.md addition
Add to BRAND.md's **Buttons** section (chips are a new but minor
extension of the existing primary/secondary button vocabulary, not a
new pattern):

> **Chips** (compact single-tap selectors, e.g. tone presets): same
> solid/outline vocabulary as buttons, at reduced scale — `6px 12px`
> padding, 14px font, 8px radius, no shadow. Selected = solid accent
> fill (primary-button treatment); unselected = transparent with accent
> border (secondary-button treatment). Selection toggles instantly, no
> transition — chips are a quick input, not a reveal/unlock/confirmation
> moment, so they sit outside the three-moment motion budget.

## How it wires up
`translate(raw, context?, tone?)` — two new optional params on the
existing function, not a new endpoint. `page.tsx` sends them in the same
POST body:

```ts
body: JSON.stringify({ text, context: context || undefined, tone: tone || undefined })
```

**Guardrail fix (critic blocker #1 — locked):** `context` is appended to
the **user** message alongside `raw`, not folded into the system prompt.
This is the fix the critic identified as the actual one-liner available:
user-role content is exactly what the existing `SYSTEM_PROMPT`'s guardrail
sentence ("If the message contains threats...") already means by "the
message," so it covers `context` for free once both live in the same user
turn — no system-prompt rewrite, no new injection surface from
attacker-controlled text landing in the instruction-bearing role.

```ts
const userContent = context
  ? `${raw}\n\n[context: ${context}]`
  : raw;

messages: [
  { role: "system", content: buildSystemPrompt(tone) },
  { role: "user", content: userContent },
]
```

Tone is the only thing that still touches the system prompt (it's
sender-selected from a closed enum of 5 values, not free text — no
injection surface):

```ts
function buildSystemPrompt(tone?: Tone): string {
  return tone
    ? `${SYSTEM_PROMPT}\n\nTone the sender wants: ${TONE_PROMPTS[tone]}`
    : SYSTEM_PROMPT;
}
```

`TONE_PROMPTS` maps each chip to one clause the model can act on (e.g.
"Direct but kind" → "be clear and unambiguous about the point, but warm
in delivery — don't hedge, don't soften the meaning away"), not just the
chip label.

**Server-side cap (critic blocker #2 — locked):** `route.ts` validates
`context` the same way it already validates `text`:

```ts
const context = typeof body.context === "string" ? body.context : undefined;
if (context && context.length > MAX_CONTEXT_CHARS) {
  return NextResponse.json(
    { error: `Context is too long (max ${MAX_CONTEXT_CHARS} characters).` },
    { status: 400 }
  );
}
```

`MAX_CONTEXT_CHARS = 200`, exported from `translate.ts` alongside the
existing `MAX_CHARS`, mirroring today's pattern exactly.

**`encodeShareId` call site is unchanged** — `encodeShareId(result.translated, text)`
continues to receive only `text` (the raw message), never `context`. This
is stated here as an explicit constraint per the critic's non-issue note,
so nothing later "helpfully" widens that call to include context.

## Scope: in
- Tone chip row (5 presets), single-select, optional.
- Optional single-line context input, 200 char cap (client `maxLength`
  **and** server-side validation in `route.ts`), with counter.
- `translate()` signature extended with `context?: string` and
  `tone?: string`. `context` is appended to the user-role message
  alongside `raw`; `tone` maps through `TONE_PROMPTS` into the system
  prompt. Guardrail sentence in `SYSTEM_PROMPT` needs no rewrite since
  "the message" already covers user-role content.
- `/api/translate` route passes both through to `translate()` and
  validates `context.length <= MAX_CONTEXT_CHARS` server-side before
  calling `translate()`.
- Neither field is persisted, shared, or sent to `/m/[id]` —
  `encodeShareId` call site unchanged, sender-side only.
- Chip and context input styling per Visual direction above; BRAND.md
  updated with the new Chips entry.

## Scope: out
- Voice-to-text (native OS dictation already covers this).
- Image/video attachments.
- The multimodal composer UI (palette icon, +, send bar redesign).
- Multi-select tone chips or free-form tone tagging.
- Any UI showing the receiver that context/tone was used.
- Automated quality eval harness — judged qualitatively per PRIORITY.md.
- Any DECLINE-scope change beyond covering `context` via the user-message
  append — no new scanning logic, no separate check function; the
  existing guardrail sentence does the work once wiring is fixed.

## Acceptance criteria
1. With both fields empty, the request body sends `context: undefined,
   tone: undefined` (omitted from JSON), and the system prompt is
   byte-identical to pre-v3 `SYSTEM_PROMPT` (no tone clause appended);
   the user-role message is exactly `raw`, unchanged from pre-v3.
2. Selecting a tone chip and translating produces a system prompt equal
   to `SYSTEM_PROMPT + "\n\nTone the sender wants: " + TONE_PROMPTS[tone]`
   — the specific guidance clause, not just the chip label.
3. Typing context text and translating sends a user-role message equal
   to `raw + "\n\n[context: " + context + "]"` — context never appears
   in the system prompt.
4. Context input enforces a 200-char hard cap client-side (`maxLength`
   on the `<input>`, mirrors the existing textarea) **and** server-side
   (`route.ts` rejects `context.length > 200` with a 400, mirroring the
   existing `MAX_CHARS` check for `text`).
5. Tapping a selected chip again deselects it; selecting a second chip
   deselects the first (single-select, not multi).
6. `/m/[id]` payload and the AES-GCM `{ t, o }` blob are unchanged: the
   `encodeShareId(result.translated, text)` call site is not modified to
   include `context` — diffing pre/post-v3 share payloads for the same
   translated text shows zero difference.
7. Neither field is required: the Translate button's enabled/disabled
   logic depends only on the main textarea's content, unaffected by
   chip/context state.
8. DECLINE fires when threat/coercion/self-harm content is present in
   `raw`, in `context`, or split across both — since both are concatenated
   into the single user-role message the guardrail sentence already
   covers, no separate check is needed. QA must test at least one case
   where the flagged content is in `context` alone with `raw` benign, to
   confirm the append wiring (not just the message-only path) is what's
   catching it.
9. Both new interactive elements (chips, context input) have visible
   native focus outlines and are reachable/operable via keyboard alone
   (Tab to focus, Enter/Space to toggle a chip).
10. Chip visual states match BRAND.md's new Chips entry exactly: solid
    `#4f46e5`/`#fff` when selected, transparent/`#4f46e5`-border/`#eee`
    text when not, no shadow, no transition on toggle.

## Resolved (was open in DESIGN.md)
- **Abuse surface**: resolved per critic's blocker #1 — `context` is
  appended to the user message, not the system prompt. The existing
  guardrail sentence covers it without modification. No separate DECLINE
  scan over context is needed or added.
- **200-char cap**: locked at 200, enforced both client- and server-side
  (critic's blocker #2). Not revisited for "more room" this iteration —
  PRIORITY.md calls the cap "engineer's call," 200 chars is enough for
  "telling my roommate I'm moving out"-length context per the user
  stories, and a real usage signal (not a hypothetical) is the bar for
  widening it later.
- **Chip pre-fill of context field**: resolved as independent, per
  DESIGN.md's lean — chip selection never writes into the context input.
  Less magic, no surprise edits, matches the "offered extra, not a form
  field" framing.

## Disagreements (none)
Critic's two blockers are both folded in as locked requirements above;
no objection rejected.
