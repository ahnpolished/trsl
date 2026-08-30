# v5 Priority

## Item
Rewrite the translation prompt to produce outputs that sound like a real
person texting their partner — brief, natural, understated — not like an AI
therapist paraphrasing feelings.

## Why this, why now
v4 shipped the edit feature and a first pass at the prompt, but the outputs
still read as AI-generated. Phrases like "I've been feeling like..." and
"I think that maybe..." are exactly the kind of therapeutic hedging the user
feedback flagged. Real people don't text like that.

The goal: under 7 words when possible, natural casual tone, no filler, no
over-explanation. Hide the ulterior motive — don't make it obvious you're
softening. If the raw message is "you never listen," the translation should
be something like "feel like you're not hearing me" not "I've been feeling
like my perspective isn't being validated."

This advances Phase 2's north star: the translation has to sound like
something a real person would actually send, or the whole "worth paying to
see the original" mechanic falls apart.

## Scope
- Rewrite SYSTEM_PROMPT to enforce brevity and naturalness.
- Rewrite TONE_PROMPTS to match (each tone should still be distinct, but
  all should be brief and casual).
- No new UI features. No backend changes. Just prompt work.

## Acceptance criteria
1. Translations average under 10 words for typical inputs (50-100 chars).
2. No therapeutic language ("I've been feeling like...", "I think that
   maybe...", "it seems like...").
3. No hedging or over-explanation.
4. Tone chips still produce distinct outputs (gentle vs direct vs playful
   should feel different), but all should be brief.
5. DECLINE guardrail still fires on threats/coercion/self-harm.
