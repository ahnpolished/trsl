# v5 Design — Prompt Rewrite

## Goal
Translations that sound like something a real person would text their partner — brief, casual, understated — so the output doesn't expose itself as AI-generated before it ever gets sent.

## User stories
1. As a husband, I can read a translated version of my raw message that sounds like something I'd actually type with my thumbs, so my wife doesn't clock it as "therapy-speak."
2. As a wife, I can pick a tone chip and get a genuinely different feel — not just a synonym swap — so the same underlying message lands the way I mean it to.
3. As either partner, I can trust that genuinely dangerous messages (threats, coercion, self-harm) get declined, so the app never accidentally escalates.

## Scope: in
- Rewrite `SYSTEM_PROMPT` in `translate.ts` — stricter brevity rules, expanded banned-phrases list, structural constraints on output format.
- Rewrite `TONE_PROMPTS` in `translate.ts` — each tone chip produces distinct output that is still brief and casual.
- Add a `buildSystemPrompt` change: inject hard word-count instruction and a few-shot block directly into the system prompt.
- Decline guardrail refinement — keep `DECLINE` trigger, tune the list of what fires it.
- No UI changes. No backend changes. No new dependencies.

## Scope: out
- Changing the model (stays gpt-4o-mini).
- Changing `max_tokens`, `temperature`, batch logic structure.
- Adding a pre-check probe (rejected in v4 QA — don't reopen).
- Any front-end or copy changes outside `translate.ts`.

---

## Prompt architecture

### 1. SYSTEM_PROMPT — structure

The system prompt should follow this order (each section earns its place):

```
[ROLE]         One sentence. "You rewrite texts between partners."
[OUTPUT RULE]  Hard constraint. Word limit. Format (raw text, no quotes, no labels).
[BANNED LIST]  Explicit phrases the model must never produce.
[STYLE RULE]   How it should sound. Show, don't tell — one sentence of vibe.
[FEW-SHOT]     6-8 input→output pairs. The model learns from these more than any rule.
[GUARDRAIL]    Decline rule with 3-4 concrete trigger examples.
```

Why this order: the model attends most to the beginning and end. Role first (primes the behavior), few-shot in the middle (anchors the pattern), guardrail last (fresh at generation time).

### 2. SYSTEM_PROMPT — specific wording

The current prompt is close to right. The v5 rewrite tightens three things:

**a) Word count enforcement.** The current prompt says "7 words or fewer." This is good but the model drifts. Reinforce it structurally:
- "Maximum 7 words. Count them before you output. If you wrote 8, cut one."
- The self-check instruction ("count them before you output") measurably reduces overshoot in instruction-tuned models.

**b) Banned phrases — the worst offenders only.** Few-shot examples teach the pattern better than a long blocklist. Ban only the 6 phrases most likely to leak from an LLM:

1. "I've been feeling"
2. "I feel like"
3. "what I'm noticing is"
4. "I need you to understand"
5. "I just want you to know"
6. "hold space"

Include as a flat list in the prompt. The few-shot examples reinforce the pattern by showing what good output looks like.

**c) Few-shot examples — the core lever.** The model follows examples more than rules. Provide 8 pairs covering: accusation, withdrawal, request for attention, jealousy, frustration, hurt, apology, and a boundary. Each example must be ≤7 words. Examples should span all tones so the model sees the range.

### 3. Few-shot examples block

Include these directly in SYSTEM_PROMPT (not as a separate message — that wastes tokens and weakens the anchor):

```
Examples (raw → rewritten):
"you never listen" → "you're not hearing me"
"who were you texting" → "who was that from"
"i'm done" → "can't do this right now"
"stop ignoring me" → "haven't heard from you all day"
"i hate when you're late" → "waiting sucks"
"you made me feel stupid" → "that one stung"
"i shouldn't have said that" → "that came out wrong, sorry"
"don't talk to me like that" → "not when you talk like that"
```

Eight examples covering 8 categories: accusation, jealousy, withdrawal, request for attention, frustration, hurt, apology, and boundary. None over 7 words. None use banned phrases. No context in examples (context is handled separately).

### 4. Tone chip design

Each tone should feel like a *different person* saying the same thing, not the same person with a thesaurus. The tone instruction is appended to the system prompt only when a tone is selected.

#### Tone prompt specifics

| Tone | One-line instruction | What it changes | Example: "you never listen" |
|------|---------------------|-----------------|------------------------------|
| gentle | "warm. like a note left on the fridge. the softness is the point." | Replaces accusation with a quiet statement of need. Still brief. | "wish you could hear me out" |
| direct | "plain. no lead-in. fewest words that work." | Strips all cushion. Gets to the ask. | "listen to me" |
| playful | "tease don't accuse. light enough to smile at." | Reframes complaint as a rib. Keeps it flirty. | "hello? anyone home up there" |
| honest | "raw. what you'd say if nobody was watching." | Drops performance. Says the uncomfortable thing plainly. | "not hearing me hurts" |
| boundary | "not up for discussion. said once, meant once." | Sets a line. Short enough to feel final. | "be here or i'm done" |

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

### 5. Decline guardrail

Keep the current rule but add specificity. The model sometimes false-positives on strong-but-safe messages like "i'm leaving you." Tighten:

```
DECLINE for: physical threats, sexual coercion, statements that could reasonably
be read as self-harm (even if ambiguous), or messages that name weapons.
Strong emotions (anger, hurt, "i'm done", "leave me alone") are NOT decline
triggers — rewrite them, don't refuse them.
```

This gives the model a clearer boundary: danger vs. strong feeling. "I'm done" is strong feeling. "I'm going to hurt you" is danger. Ambiguous self-harm ("I can't do this anymore", "everyone would be better off without me") → decline, don't guess.

---

## Example transformations by tone

Full set for QA to verify against:

| Raw | gentle | direct | playful | honest | boundary |
|-----|--------|--------|---------|--------|----------|
| "you never listen to me" | "wish you could hear me out" | "listen to me right now" | "hello? anyone home up there" | "not hearing me hurts" | "be here or i'm done" |
| "you always forget things i tell you" | "things keep slipping past you" | "remember what i told you" | "goldfish brain strike again 🐟" | "being forgotten hurts" | "hear me or stop asking" |
| "stop looking at your phone" | "want you here with me" | "phone down, eyes on me" | "my rival is a 6-inch screen" | "scrolling is louder than us" | "phone away or i'm leaving" |
| "you don't care about me" | "need you showing up more" | "show me you care" | "where did my person go" | "you're not showing up. it hurts" | "effort or i'm done" |
| "i hate when you're late" | "waiting is hard for me" | "be on time" | "fashionably late again? 🙄" | "you being late makes me anxious" | "if you're late again i'm leaving" |

### Anti-patterns to avoid (for QA check)

1. **Therapeutic opening**: "I've been feeling like..." / "What I'm noticing is..." / "I think that maybe..."
2. **Over-length**: anything over 7 words (8 is a fail, 10 is a disaster)
3. **Performative softness**: "I just want you to know that I feel..." — this is *trying* to be gentle, which reads as manipulative
4. **Therapy vocabulary**: "validate", "hold space", "my truth", "perspective", "needs"
5. **Hedging cascade**: "I wonder if maybe perhaps..." — one hedge is human, three are a robot
6. **Setup phrases**: "Can I be honest with you?" / "Not to be dramatic but..." — these are filler
7. **Quotation marks or labels**: output should be raw text. No `gentle:` prefix, no quotes around the output.

---

## Acceptance criteria

These are testable. QA should run each one literally.

1. **Word count**: For 10 test inputs of 50-100 characters, the average translation length is ≤7 words, and no single output exceeds 10 words.
2. **No therapeutic language**: None of the 10 outputs contain any phrase from the banned list (feeling-reports, hedging, therapy-speak, setup phrases).
3. **No filler**: No output contains "I just want", "can I be honest", "not to be dramatic", or "I wanted to say".
4. **Tone distinctness**: For the same raw input, all 5 tone outputs are different from each other. A human reader can correctly guess which tone produced which output (≥3 out of 5 correct).
5. **Decline accuracy**: Threats ("I'll hurt you"), coercion ("do this or I'll leave you homeless"), and self-harm ("I want to end it") → DECLINE. Strong-but-safe messages ("I'm done", "leave me alone", "I hate you") → translated, not declined.
6. **Raw output format**: No output contains quotation marks, tone labels, prefixes, or any formatting — just the translated text.

### Resolved decisions

1. **Emoji in playful**: Yes — one emoji max, playful tone only. Real people use emoji to signal "I'm teasing, not attacking." The playful tone prompt includes this constraint.
2. **Honest tone word count**: Universal 7-word limit applies to all tones including honest. Honest should compress, not expand.
3. **Context in few-shots**: Left pure — no context in examples. Context is handled separately and most inputs don't use it.
