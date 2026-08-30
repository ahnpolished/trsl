# v5 Final Design — Prompt Rewrite

> **Status: LOCKED.** This is the implementation contract. No TBDs, no open questions.
> Engineer implements exactly this spec.

## Goal

Translations that sound like something a real person would text their partner — brief, casual, understated — so the output doesn't expose itself as AI-generated before it ever gets sent.

## User stories

1. As a husband, I can read a translated version of my raw message that sounds like something I'd actually type with my thumbs, so my wife doesn't clock it as "therapy-speak."
2. As a wife, I can pick a tone chip and get a genuinely different feel — not just a synonym swap — so the same underlying message lands the way I mean it to.
3. As either partner, I can trust that genuinely dangerous messages (threats, coercion, self-harm) get declined, so the app never accidentally escalates.

## Scope: in

- Rewrite `SYSTEM_PROMPT` in `translate.ts` — stricter brevity rules, 6 banned phrases, structural constraints on output format.
- Rewrite `TONE_PROMPTS` in `translate.ts` — each tone chip produces distinct output that is still brief and casual.
- Add a `buildSystemPrompt` change: inject hard word-count instruction and a few-shot block directly into the system prompt.
- Decline guardrail refinement — keep `DECLINE` trigger, tune the list of what fires it, include ambiguous self-harm.
- No UI changes. No backend changes. No new dependencies.

## Scope: out

- Changing the model (stays gpt-4o-mini).
- Changing `max_tokens`, `temperature`, batch logic structure.
- Adding a pre-check probe (rejected in v4 QA — don't reopen).
- Any front-end or copy changes outside `translate.ts`.

---

## Prompt architecture

### 1. SYSTEM_PROMPT — structure

The system prompt follows this order (each section earns its place):

```
[ROLE]         One sentence. "You rewrite texts between partners."
[OUTPUT RULE]  Hard constraint. Word limit. Format (raw text, no quotes, no labels).
[BANNED LIST]  6 explicit phrases the model must never produce.
[STYLE RULE]   How it should sound. Show, don't tell — one sentence of vibe.
[FEW-SHOT]     8 input→output pairs covering all 8 categories. The model learns from these more than any rule.
[GUARDRAIL]    Decline rule with concrete trigger examples including ambiguous self-harm.
```

Why this order: the model attends most to the beginning and end. Role first (primes the behavior), few-shot in the middle (anchors the pattern), guardrail last (fresh at generation time).

### 2. SYSTEM_PROMPT — specific wording

**a) Word count enforcement.** The prompt says "Maximum 7 words. Count them before you output. If you wrote 8, cut one." The self-check instruction primes brevity even though LLMs count tokens not words — it doesn't hurt and may help.

**b) Banned phrases — 6 worst offenders.** Few-shot examples teach the pattern better than a long blocklist. Ban only the 6 phrases most likely to leak from an LLM:

1. "I've been feeling"
2. "I feel like"
3. "what I'm noticing is"
4. "I need you to understand"
5. "I just want you to know"
6. "hold space"

Include as a flat list in the prompt. The few-shot examples reinforce the pattern by showing what good output looks like.

**c) Few-shot examples — 8 categories, all ≤7 words.** The model follows examples more than rules. Provide 8 pairs, one per category:

```
Examples (raw → rewritten):

accusation:       "you never listen"               → "you're not hearing me"
jealousy:         "who were you texting"            → "who was that from"
withdrawal:       "i'm done"                        → "can't do this right now"
request attention:"do you even see me"              → "i need you right now"
frustration:      "i hate when you're late"         → "waiting sucks"
hurt:             "you made me feel stupid"         → "that one stung"
apology:          "i shouldn't have said that"      → "that came out wrong, sorry"
boundary:         "don't talk to me like that"      → "not when you talk like that"
```

**Word count verification** (all outputs):
| Output | Words |
|--------|-------|
| "you're not hearing me" | 4 |
| "who was that from" | 4 |
| "can't do this right now" | 5 |
| "i need you right now" | 5 |
| "waiting sucks" | 2 |
| "that one stung" | 3 |
| "that came out wrong, sorry" | 5 |
| "not when you talk like that" | 6 |

All ≤7. No banned phrases. No context in examples (context is handled separately).

**Note for engineer:** Category labels (`accusation:`, `jealousy:`, etc.) are for spec clarity only — do NOT include them in the actual prompt. The prompt contains only the raw → rewritten pairs.

### 3. Tone chip design

Each tone should feel like a *different person* saying the same thing, not the same person with a thesaurus. The tone instruction is appended to the system prompt only when a tone is selected.

#### Tone prompt specifics

| Tone | One-line instruction | What it changes | Example: "you never listen" |
|------|---------------------|-----------------|------------------------------|
| gentle | "warm. like a note left on the fridge. the softness is the point." | Replaces accusation with a quiet statement of need. Still brief. | "wish you could hear me out" (6) |
| direct | "plain. no lead-in. fewest words that work." | Strips all cushion. Gets to the ask. | "listen to me" (3) |
| playful | "tease don't accuse. light enough to smile at. one emoji max." | Reframes complaint as a rib. Keeps it flirty. | "hello? anyone home up there" (5) |
| honest | "raw. what you'd say if nobody was watching." | Drops performance. Says the uncomfortable thing plainly. | "not hearing me hurts" (4) |
| boundary | "not up for discussion. said once, meant once." | Sets a line. Short enough to feel final. | "be here or i'm done" (5) |

#### What makes them distinct

The key test: if you remove the tone label, a reader can guess which tone was used. If all five tones produce outputs that could swap without anyone noticing, the tones aren't working.

- **Gentle vs honest**: gentle softens ("wish you could..."), honest names the impact ("hurts"). Both short, but one cushions and one doesn't.
- **Direct vs boundary**: direct is a request ("listen to me"), boundary is a consequence ("or i'm done"). One invites, one closes.
- **Playful** stands alone — it's the only one that reframes the situation rather than stating it. If the playful output doesn't make you smirk, it failed.

#### Tone prompt wording (for the code)

```typescript
const TONE_PROMPTS: Record<Tone, string> = {
  gentle: "gentle tone — warm and soft, like a note on the fridge. cushion the ask, don't drop it.",
  direct: "direct tone — say it plain. no cushion, no lead-in. fewest words that land the point.",
  playful: "playful tone — tease, don't accuse. reframe it as something you'd smile typing. one emoji max if it fits.",
  honest: "honest tone — raw and unperformed. say the thing you'd only say with no audience.",
  boundary: "boundary tone — a line, not a negotiation. short, final, not mean."
};
```

Changes from current:
- Added "tone" word so the model treats it as a mode, not a description.
- Each prompt now contains at least one constraint ("no cushion", "no lead-in", "short, final") — not just a vibe.
- Playful now says "reframe" — the current "light it up" is too vague, the model doesn't know *how* to be playful.
- Playful allows one emoji max — real people use emoji to signal teasing, not attacking.

### 4. Decline guardrail

```
DECLINE for: physical threats, sexual coercion, statements that could reasonably
be read as self-harm (even if ambiguous), or messages that name weapons.

Ambiguous self-harm → decline. "i can't do this anymore", "everyone would be
better off without me", "i wish i weren't here" — decline, don't guess.
The cost of declining a safe message is near zero (user retypes). The cost
of not declining a dangerous one is not.

Strong emotions (anger, hurt, "i'm done", "leave me alone") are NOT decline
triggers — rewrite them, don't refuse them.
```

---

## Example transformations by tone

Full set for QA to verify against. **Every output ≤7 words.**

| Raw | gentle | direct | playful | honest | boundary |
|-----|--------|--------|---------|--------|----------|
| "you never listen to me" | "wish you could hear me out" (6) | "listen to me" (3) | "hello? anyone home up there" (5) | "not hearing me hurts" (4) | "be here or i'm done" (5) |
| "you always forget things i tell you" | "things keep slipping past you" (5) | "remember what i told you" (5) | "goldfish brain strike again 🐟" (4) | "being forgotten hurts" (3) | "hear me or stop asking" (5) |
| "i shouldn't have yelled at you" | "that came out wrong, i'm sorry" (6) | "i was wrong, i'm sorry" (5) | "i'm sorry i snapped 😅" (4) | "i regret yelling, i'm sorry" (5) | "i was wrong, won't happen again" (6) |
| "i miss you, come home soon" | "come home early tonight" (4) | "come home, i miss you" (5) | "where did my person go" (5) | "i need you right now" (5) | "be home or i'm done waiting" (6) |
| "i hate when you're late" | "waiting is the worst" (4) | "be on time" (3) | "fashionably late again 🙄" (3) | "you being late, it rattles me" (6) | "late again, i'm out" (4) |

**Word count verification** — every output in this table is ≤7 words. Counts shown in parentheses for QA.

### Anti-patterns to avoid (for QA check)

1. **Therapeutic opening**: "I've been feeling like..." / "What I'm noticing is..." / "I think that maybe..."
2. **Over-length**: anything over 7 words (8 is a fail, 10 is a disaster)
3. **Performative softness**: "I just want you to know that I feel..." — this is *trying* to be gentle, which reads as manipulative
4. **Therapy vocabulary**: "validate", "hold space", "my truth", "perspective", "needs"
5. **Hedging cascade**: "I wonder if maybe perhaps..." — one hedge is human, three are a robot
6. **Setup phrases**: "Can I be honest with you?" / "Not to be dramatic but..." — these are filler
7. **Quotation marks or labels**: output should be raw text. No `gentle:` prefix, no quotes around the output.

---

## Resolved decisions

These were open questions in DESIGN.md. Now locked:

1. **Emoji in playful**: **Yes** — one emoji max, playful tone only. Real people use emoji to signal "I'm teasing, not attacking." The playful tone prompt includes this constraint. Other tones: no emoji.
2. **Honest tone word count**: **Universal 7-word limit applies to all tones including honest.** Honest should compress, not expand. The honest tone prompt says "raw and unperformed" — raw doesn't mean long.
3. **Context in few-shots**: **Left pure — no context in examples.** Context is handled separately by `buildSystemPrompt` and most inputs don't use it. Adding context to few-shots would teach the model to expect context it won't always get.

---

## Acceptance criteria

These are testable. QA should run each one literally.

1. **Word count**: For 10 test inputs of 50-100 characters, the average translation length is ≤7 words, and **no single output exceeds 10 words**.
2. **No therapeutic language**: None of the 10 outputs contain any of the 6 banned phrases: "I've been feeling", "I feel like", "what I'm noticing is", "I need you to understand", "I just want you to know", "hold space".
3. **No filler**: No output contains "I just want", "can I be honest", "not to be dramatic", or "I wanted to say".
4. **Tone distinctness**: For the same raw input, all 5 tone outputs are different from each other. A human reader can correctly guess which tone produced which output (≥3 out of 5 correct).
5. **Decline accuracy**: Threats ("I'll hurt you"), coercion ("do this or I'll leave you homeless"), self-harm ("I want to end it"), AND ambiguous self-harm ("I can't do this anymore", "everyone would be better off without me") → DECLINE. Strong-but-safe messages ("I'm done", "leave me alone", "I hate you") → translated, not declined.
6. **Raw output format**: No output contains quotation marks, tone labels, prefixes, or any formatting — just the translated text.

---

## Change log from DESIGN.md

| Change | Reason | Source |
|--------|--------|--------|
| All few-shot and tone-table examples verified ≤7 words | Blocker #1 — examples violated own rules | Critic objection #1 |
| Few-shot block restructured: 3 accusation examples replaced with jealousy, request for attention, apology | Blocker #2 — coverage was accusation-heavy, 5 of 8 | Critic objection #2 |
| Banned phrases reduced from 16 to 6 | Strong concern — long negative-constraint lists make banned patterns salient | Critic objection #3 |
| Decline guardrail expanded: ambiguous self-harm → decline | Strong concern — false negatives are safety failures | Critic objection #4 |
| Open questions #1-#3 resolved | These were deferred decisions, not questions | Critic objection #5 |
| Tone table diversified: inputs now span accusation, frustration, apology, affection, frustration | Coverage — shows model how tones handle non-complaint inputs | Blocker #2 follow-through |
