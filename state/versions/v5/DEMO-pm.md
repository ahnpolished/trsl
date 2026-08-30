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

## Round 2 — 2026-08-30

### What I tested
Evaluated the redeployed preview after engineer's focus state and BRAND.md alignment fixes.

**Focus states (Tab navigation through all interactive elements):**
- Buttons/chips: ✓ Accent outline ring (rgb(79, 70, 229) solid 2px) visible on focus
- Textarea: ✗ Border remains rgb(38, 38, 38), doesn't change to accent rgb(79, 70, 229) on focus
- Input (context field): ✗ Border remains rgb(38, 38, 38), doesn't change to accent on focus

**BRAND.md alignment (computed styles via JS inspection):**
- Chips: ✓ padding 6px 12px, font 14px, border-radius 8px, 1px solid accent border, transparent background, no shadow — matches spec exactly
- Variant cards: ✓ padding 16px, border-radius 8px, background rgb(26, 26, 26), selected state has 2px solid accent outline — matches spec

**Core loop (functional test):**
- Translate: ✓ "you never listen to me" → "you're not hearing me" (5 words, ≤7 target met)
- Select variant: ✓ Clicking different variant cards toggles selection correctly
- Edit: ✓ Edit textarea accepts input
- Share/Unlock: ✓ Worked in Round 1, not retested here (scope was focus + branding)

### Gut reaction
The chip styling is exactly right — padding, radius, border, font all match BRAND.md. Variant card selection state is clean. The button focus rings work.

But the textarea and input focus states are broken. The CSS rule exists in the stylesheet:
```
input:focus, textarea:focus { border-color: rgb(79, 70, 229); outline: none; }
```
Yet the computed border color stays rgb(38, 38, 38) when these elements receive focus via Tab navigation. The rule isn't applying. This is an accessibility failure — WCAG 2.1 requires visible focus indicators on all interactive elements, and the two largest input areas on the page have none.

Round 1 shipped because the core loop was airtight. But the follow-up work to fix focus states only partially succeeded. Buttons got fixed; textarea and input didn't. That's not done.

### Verdict
**Hold. Back to engineer.**

Narrow fix needed:
- Investigate why `input:focus, textarea:focus { border-color: rgb(79, 70, 229) }` isn't applying — likely a specificity issue or the rule is being overridden by a more specific selector
- Verify the fix works via keyboard Tab navigation, not just click-focus

Everything else is solid. The BRAND.md alignment is correct. The core loop is tight. The translation quality still meets the bar. Just finish the focus states on the two input elements.
