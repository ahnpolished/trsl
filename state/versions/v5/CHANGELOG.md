# v5 Changelog

## System Prompt Rewrite
- Restructured SYSTEM_PROMPT with explicit sections: role, output rules, banned list, style rule, few-shot examples, guardrail
- Added hard word count instruction: "Maximum 7 words. Count them before you output. If you wrote 8, cut one."
- Replaced old 7 examples with 8 category-specific examples (accusation, jealousy, withdrawal, request attention, frustration, hurt, apology, boundary)
- All few-shot examples verified ≤7 words
- Removed context from few-shot examples (context handled separately by buildSystemPrompt)

## Banned Phrases Reduced
- Reduced from 16 phrases to 6 worst offenders:
  1. "I've been feeling"
  2. "I feel like"
  3. "what I'm noticing is"
  4. "I need you to understand"
  5. "I just want you to know"
  6. "hold space"

## Tone Prompts Enhanced
- Added "tone" label to each prompt so model treats it as a mode
- Each tone now includes at least one hard constraint
- Playful tone now says "reframe" (was vague "light it up") and allows one emoji max
- Tone prompts:
  - gentle: "warm and soft, like a note on the fridge. cushion the ask, don't drop it."
  - direct: "say it plain. no cushion, no lead-in. fewest words that land the point."
  - playful: "tease, don't accuse. reframe it as something you'd smile typing. one emoji max if it fits."
  - honest: "raw and unperformed. say the thing you'd only say with no audience."
  - boundary: "a line, not a negotiation. short, final, not mean."

## Decline Guardrail Tightened
- Expanded to catch ambiguous self-harm: "i can't do this anymore", "everyone would be better off without me", "i wish i weren't here"
- Clarified that strong emotions (anger, hurt, "i'm done", "leave me alone") are NOT decline triggers
- Cost-benefit: declining a safe message is near zero cost, not declining a dangerous one is not

## Visual Refinements

### Typography
- Added global line-height 1.5 and font smoothing to body
- Wordmark: fontWeight 500 (was default), letterSpacing -0.5px, lineHeight 1, marginBottom 8px (was 4px)
- Tagline: fontSize 15px (was default), color #888 (was #999), marginBottom 32px (was 20px), lineHeight 1.4
- Card text: fontSize 17px, lineHeight 1.6 (was 1.5)
- Chips/buttons: fontWeight 500 (was 600), letterSpacing 0.2px
- Meta/counter text: letterSpacing 0.3px

### Spacing
- Page padding: 32px 20px (was 24px 16px) - more headroom and breathing room
- Textarea padding: 16px (was 12px)
- Tone chip padding: 8px 14px (was 6px 12px)

### Surface Hierarchy
- Textarea background: #161616 (was #1a1a1a) - inputs recede, cards present
- Textarea border: #262626 (was #333) - quieter, less "form field"
- Context input: same treatment as textarea
- Unselected tone chips: border #333, color #888 (was border #4f46e5, color #eee) - unselected chips recede
- Variant cards (unselected): border "1px solid transparent" (was "1px solid #333") - cards defined by surface alone
- Variant cards (selected): background #1e1e1e (was #1a1a1a), outline "2px solid #4f46e5" (was border) - subtle lift + accent
- Disabled button background: #2a2a2a (was #555), color #666 (was #fff), opacity 0.6 - clearly inactive

### Motion & Easing
- Result reveal: 400ms cubic-bezier(0.16, 1, 0.3, 1) (was 350ms ease-out) - more dramatic, premium easing
- Staggered card animations: each variant card delays by 80ms for cascade effect
- Unlock exit: blur(8px) (was 4px), 300ms (was 220ms) - more cinematic
- Unlock enter: 500ms cubic-bezier(0.16, 1, 0.3, 1) (was 400ms ease-out) - more dramatic
- Processing pulse: 1200ms (was 900ms) - calmer, less anxious

### Interactive States
- Button active: transform scale(0.98), opacity 0.9 - tactile press feedback
- Textarea/input focus: border-color #4f46e5 - accent border on focus
- Textarea placeholder: color #666 (was browser default ~#999) - whispers, doesn't shout
- Added transitions: textarea/input border-color 200ms, button transform/opacity 80ms/150ms

### Share Page
- Card lineHeight: 1.6 (was default)
- Buttons: fontWeight 500, letterSpacing 0.2px (consistent with home page)
