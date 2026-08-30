# v3 Design

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

## How it wires up
`translate(raw, context?, tone?)` — two new optional params on the
existing function, not a new endpoint. `page.tsx` sends them in the same
POST body:

```ts
body: JSON.stringify({ text, context: context || undefined, tone: tone || undefined })
```

`translate.ts` builds the system prompt by appending a situational block
only when at least one of the two is present — no empty "Context: " noise
in the prompt when the sender skipped both:

```
${SYSTEM_PROMPT}

${tone ? `Tone the sender wants: ${TONE_PROMPTS[tone]}` : ""}
${context ? `Context from the sender: ${context}\nUse this only to resolve ambiguity in what they meant — do not quote it back or refer to it directly in the output.` : ""}
```

`TONE_PROMPTS` maps each chip to one clause the model can act on (e.g.
"Direct but kind" → "be clear and unambiguous about the point, but warm
in delivery — don't hedge, don't soften the meaning away"), not just the
chip label — a bare label is not a rewritten prompt, and the priority
doc is explicit this needs real prompt work, not a cosmetic variable.

## Scope: in
- Tone chip row (5 presets), single-select, optional.
- Optional single-line context input, 200 char cap, with counter.
- `translate()` signature extended with `context?: string` and
  `tone?: string`, both threaded into a rewritten system prompt with
  real per-tone guidance clauses.
- `/api/translate` route passes both through to `translate()`.
- Neither field is persisted, shared, or sent to `/m/[id]` — sender-side
  only, exactly as PRIORITY.md requires.

## Scope: out
- Voice-to-text (native OS dictation already covers this).
- Image/video attachments.
- The multimodal composer UI (palette icon, +, send bar redesign).
- Multi-select tone chips or free-form tone tagging.
- Any UI showing the receiver that context/tone was used.
- Automated quality eval harness — this iteration is judged
  qualitatively on real ambiguous messages, per PRIORITY.md.
- Abuse/injection scanning of the new context field beyond what already
  exists — see open question below.

## Acceptance criteria
1. With both fields empty, the request body and system prompt are
   byte-identical to pre-v3 behavior (no empty "Context:" or "Tone:"
   lines leak into the prompt).
2. Selecting a tone chip and translating produces a system prompt
   containing that tone's specific guidance clause, not just the chip
   label.
3. Typing context text and translating produces a system prompt
   containing that literal text plus the "resolve ambiguity" framing
   instruction.
4. Context input enforces a 200-char hard cap (cannot type past it,
   mirrors existing `maxLength` pattern on the main textarea).
5. Tapping a selected chip again deselects it; selecting a second chip
   deselects the first (single-select, not multi).
6. `/m/[id]` payload and the AES-GCM `{ t, o }` blob are unchanged —
   diffing pre/post-v3 share payloads for the same translated text
   shows zero difference.
7. Neither field is required: the Translate button's enabled/disabled
   logic is unaffected by their state.
8. DECLINE path still fires correctly when the main message triggers it,
   regardless of what's in context/tone.

## Open questions for critic
- **Abuse surface**: PRIORITY.md flags this explicitly — a second
  free-text input is a second place for prompt-injection or the same
  threat/coercion/self-harm content the DECLINE guardrail exists for
  (e.g. stuffing it into context instead of the message). Does the
  DECLINE check need to run over `context` too before this ships, or is
  that an accepted gap for v3 given context is capped at 200 chars and
  never reaches the receiver? My lean: scan both fields together (one
  DECLINE check over `message + context` concatenated) since it's a
  one-line change to `translate()` and closes the gap PRIORITY.md
  already named — but flagging for critic since PM explicitly punted
  the decision to design time.
- Is 200 chars the right cap, or does real usage need more room to
  describe a relationship/situation without feeling clipped?
- Should chip selection also pre-fill the context field with a
  matching phrase (making the two visually connected), or stay fully
  independent as designed above? I lean independent — less magic, less
  surprise when editing context after tapping a chip.
