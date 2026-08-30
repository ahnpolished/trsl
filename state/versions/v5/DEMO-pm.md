# v5 Demo Evaluation

## Round 1 — 2026-08-30

### Test flow
Tested the full sender → receiver flow on the deployed preview:

**Sender side:**
1. Entered raw message: "you never listen to me when i'm trying to tell you something important"
2. Selected "Gentle" tone chip
3. Added context: "we've been arguing about housework and i feel ignored"
4. Clicked Translate → got 3 variants
5. Picked first variant: "I feel overlooked when you don't listen."
6. Clicked Share → button showed "Copied!"

**Receiver side:**
1. Opened share link in fresh browser session
2. Saw translated message: "I feel overlooked when you don't listen."
3. "View original — $1" button visible
4. Tapped it → button changed to "Unlock the original — $1" (paywall appeared)
5. Tapped again → "Unlocking…" (loading state, ~2-3 seconds)
6. Original revealed with clear contrast:
   - **Original:** "you never listen to me when i'm trying to tell you something important"
   - **Context:** "sent to you as:"
   - **Translated:** "I feel overlooked when you don't listen."

### Translation quality check
- **Word count:** 7 words ✓ (meets ≤7 target)
- **Banned phrases:** None detected ✓
  - No "I've been feeling", "I feel like", "what I'm noticing is", etc.
- **Tone:** Natural, brief, not therapeutic-sounding ✓
- **Distinctness:** "I feel overlooked" is direct and human, not AI paraphrase

### Gut reaction
This works. The core loop is tight:

1. **Translation quality is good enough.** The output is brief, natural, and doesn't expose itself as AI-generated. "I feel overlooked when you don't listen" is something a real person would text. It's not perfect poetry, but it's credible — and that's the bar.

2. **The paywall progression feels right.** "View original — $1" → "Unlock the original — $1" → "Unlocking…" → revealed. Each step has clear intent. The loading state ("Unlocking…") adds weight to the moment. It doesn't feel like a gimmick; it feels like a transaction.

3. **The reveal creates a genuine moment.** The contrast between "you never listen to me when i'm trying to tell you something important" and "I feel overlooked when you don't listen" is interesting. It makes you want to see what was really said. The gap between raw and translated is the value — and it's visible.

4. **The mechanics work.** Share link generation, HMAC-signed payload, decode on the receiver side, paywall, unlock — all functional. No broken flows, no dead ends.

### Does this advance Phase 2?
Phase 2 north star: "a real recipient taps the mock $1 unlock and the reveal feels worth the tap"

**Yes.** The unlock mechanic works. The paywall progression is clear. The reveal shows meaningful contrast between raw and translated. The translation quality is good enough that it doesn't break the illusion.

The one open question: would a *real* recipient (not a tester) actually tap the $1 unlock? The mechanics are right, but conversion depends on emotional stakes — does the recipient care enough to pay? That's a test for real usage, not a browser automation session. But the *potential* is there. The gap between "I feel overlooked" and "you never listen to me when i'm trying to tell you something important" is genuinely interesting. It makes you curious.

### Verdict
**Ship.**

The core loop works. Translation quality meets the bar (brief, natural, no therapeutic language). The paywall progression feels intentional, not gimmicky. The reveal creates a moment of contrast that justifies the unlock.

This is the foundation Phase 2 needs. Ship it, then test with real recipients to validate the conversion question.
