# v5 Discussion — Critic Review

## Objections

### 1. BLOCKER — The design's own examples violate its own rules

The acceptance criteria say "no single output exceeds 10 words" and the system prompt instruction says "Maximum 7 words." But the design's full tone transformation table — the very examples QA will verify against — contains outputs that break the 7-word rule:

| Output | Word count |
|--------|-----------|
| "i don't feel cared about and that's real" | 9 |
| "i need effort or i can't keep doing this" | 9 |
| "when you forget it makes me feel invisible" | 8 |
| "i need you present or i'm walking away" | 8 |
| "the scrolling is louder than us right now" | 7 ✓ |
| "you're not hearing me and it hurts" | 8 |

The few-shot block in the system prompt is the strongest lever — "the model learns from these more than any rule," the design says. So the model will learn from *its own examples* that 8-9 words is acceptable. You cannot simultaneously tell the model "maximum 7 words, count them" and show it 6 examples out of 14 that are 8-9 words. The examples will win. Every time.

**Fix:** Every example in the system prompt few-shot block AND the QA transformation table must be ≤7 words. If honest tone can't compress to 7, the honest tone prompt needs a different strategy (shorter inputs, or accept that honest is the one tone that sometimes hits 8 — but then say so explicitly and adjust the acceptance criterion).

### 2. BLOCKER — Few-shot coverage is a lie

The design claims the 8 examples cover "accusation, withdrawal, request for attention, jealousy, frustration, hurt, apology, and a boundary." Count what's actually there:

1. "you never listen" → accusation
2. "you always forget" → accusation
3. "i'm done" → withdrawal
4. "you don't care" → accusation
5. "stop ignoring me" → accusation
6. "why do you do this" → accusation
7. "i hate when you're late" → frustration
8. "you made me feel stupid" → hurt

Five accusations. No request for attention. No jealousy. No apology. No boundary. The model will overfit to complaint-shaped inputs because that's almost all it has seen. When the husband types "i miss you" or "i'm sorry" or "can we talk tonight" — inputs that are positive, apologetic, or forward-looking — the prompt has shown it zero examples of how to handle those shapes.

**Fix:** Replace at least 3 of the 5 duplicate accusation examples with the missing categories. The few-shot block should reflect the actual distribution of real inputs, not the designer's fixation on one shape.

### 3. Strong — Banned phrases list will backfire

The expanded banned list has ~16 phrases across 4 categories. Listing that many negative constraints in a prompt has a known failure mode: the model's attention is drawn to the exact patterns you're telling it to avoid. "Don't say 'I've been feeling'" makes "I've been feeling" salient. This isn't theoretical — it's why negative-constraint prompts are the least reliable kind.

The few-shot block is the right answer here (show what TO do, not what to avoid). But the design is doing both: a long banned list AND few-shot examples. The banned list is competing with the examples for the model's attention.

**Fix:** Cut the banned list to the 5-6 worst offenders (the ones that appear most reliably in AI output). Let the few-shot examples do the heavy lifting — they already demonstrate the right patterns. The banned list is insurance, not the main strategy.

### 4. Strong — Decline guardrail has a real gap

The design draws the line at "physical threats, sexual coercion, explicit self-harm, or messages that name weapons." But the grey zone is wide and the design doesn't address it:

- "i wish i were dead" — no weapon named, reads as hyperbole in context, but could be genuine self-harm. The current rule would NOT decline this.
- "you'll regret this" — not a physical threat, no weapon, but could be coercive depending on context.
- "i can't take this anymore" — could be a breakup or a crisis. The design says strong emotions get translated, not declined. But if this is a self-harm signal and the app cheerfully translates it to "i need a break," that's a safety failure.

The design optimizes for avoiding false positives (declining safe messages) but doesn't grapple with false negatives (passing through dangerous ones). A missed threat is an App Store review and a lawsuit. A false positive is a mildly annoyed user. The asymmetry is huge.

**Fix:** Add a "when in doubt, decline" escape hatch. Or — smaller fix — add "statements that could reasonably be read as self-harm" to the decline list, even if they're ambiguous. The cost of declining "i can't take this anymore" is near zero (the user retypes). The cost of not declining it is not.

### 5. Noted — Open questions aren't open, they're deferred decisions

Three open questions are listed, but they're not minor — they affect the prompt structure:

- **Emoji in playful**: If yes, the few-shot examples should include one with emoji to teach the pattern. If no, say so.
- **Honest tone word count**: This is the blocker in objection #1. It needs a decision, not a shrug.
- **Context in few-shots**: Low priority, fair to defer.

These aren't questions for the critic — they're decisions the designer needs to make before shipping. Flagging them so they don't get lost.

### 6. Noted — "Count them before you output" is cargo cult

The self-check instruction ("Count them before you output. If you wrote 8, cut one.") sounds clever but LLMs don't count words. They predict tokens. A 7-word output and an 8-word output don't feel different to the model — the token boundaries don't align with word boundaries. This instruction might help *a little* by priming brevity, but treating it as a structural guarantee is wrong.

Not a blocker — include it if you want, it doesn't hurt. But don't count on it.

## What works

The prompt architecture ordering (role → constraint → banned → style → examples → guardrail) is sound. Putting few-shot in the system prompt instead of a separate message is correct — it's a stronger anchor and saves tokens. The tone chip redesign (adding constraints, not just vibes) is a real improvement. "Reframe" for playful is the right instinct.

The core instinct — fewer rules, more examples — is correct. The execution just needs the examples to actually match the rules.

## Verdict

**revise**

Two blockers. The examples must match the word-count rule (objection #1) and the few-shot coverage must actually span the claimed input categories (objection #2). Both are fixable without restructuring — they're content fixes, not architecture changes. Fix those two and this design ships.
