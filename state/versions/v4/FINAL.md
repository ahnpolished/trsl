# v4 Final Design

## Goal
Turn the composer into a small iteration surface the sender can steer—three variants, pick one, regenerate—and reframe the receiver's unlock as a chosen reveal ("View original — $1") that surfaces the mock $1 paywall only after curiosity is already engaged.

## User stories
- As a sender, I can generate three translated variants from one raw message so I can choose the take that actually sounds like me.
- As a sender, I can tap "Regenerate" to get three fresh variants without retyping so I can keep iterating until one lands.
- As a sender, I can tap a variant card to select it so the message my partner receives is the one I want.
- As a receiver, I can read the translated message first and see the cost before I tap, so the unlock feels like my choice rather than a surprise.

## Scope: in
- Generate 3 translation variants per request by default.
- Display variants as stacked selectable cards in the composer; first variant selected by default.
- Regenerate button fetches 3 new variants using the same raw message, tone chip, and context input.
- Share button sends the currently selected variant through the existing signed/encrypted share pipeline.
- Tone chips and context input from v3 feed every regeneration (and every first translation).
- `/m/[id]` shows the chosen translated message and a "View original — $1" button.
- The price ($1) is visible on `/m/[id]` before the receiver taps.
- Tapping "View original — $1" transitions to the mock $1 paywall state.
- Tapping paywall confirm reveals the original with the same animation as v2/v3.
- Keep the DECLINE guardrail, HMAC-signed share IDs, AES-GCM encryption, and sender/unlock localStorage flags unchanged.
- Backend rate/cost cap as a ship blocker for v4: enforce a per-IP rate limit and a hard daily spend ceiling on `/api/translate`, with a clean user-facing error when either limit is hit. No UI meter or admin dashboard in v4.
- DECLINE guardrail (post-check only): generate variants with `n: 3`, then check every returned string for the `DECLINE` prefix; if any variant declines, discard the entire batch, return `{ declined: true }`, and show the existing DECLINE state. There is no pre-generation DECLINE probe.
- Regenerate is subject to the same backend rate/cost cap as Translate.

## Scope: out
- Real Stripe integration (still mock paywall).
- Inline editing of a generated variant.
- Changing the number of variants from 3.
- Receiver reply/reaction.
- Saving favorite variants across sessions.
- Per-session cost meters or regenerate counters in the UI.
- Receiver hint that the sender iterated through variants (e.g., "one of three" marker). Accepted as a trust tension to monitor; not in v4.

## Visual direction

Everything reuses `agents/BRAND.md` palette, type, radius, and motion vocabulary. The new patterns added in this pass (selectable variant cards and upfront price disclosure) are already reflected in `agents/BRAND.md`.

### Composer flow
Top-to-bottom order, unchanged from v3 where noted:
1. Raw-message textarea (existing).
2. Char counter (existing).
3. Tone chip row (existing v3).
4. Context input (existing v3).
5. **Translate button** when no variants are showing; **variant stack + Regenerate + Share** after translation.

When Translate is pressed, the button enters the existing loading state (slow opacity pulse, disabled) while 3 variants are generated. Once ready, the button is replaced by the variant stack.

### Variant cards
- Card base from `BRAND.md`: `#1a1a1a` background, 8px radius, 16px padding, no shadow.
- Default border: `1px solid #333` (same border value as the v3 context input).
- Selected border: `2px solid #4f46e5` (accent).
- Text: `#eeeeee`, 16px, 1.5 line-height—treat the variant as content, not a label.
- Stack layout: vertical, 12px gap between cards.
- Entire card is tappable to select. Selection is single-select only; tapping another card moves selection there. Selection state swaps instantly—no transition—because this is a quick input, not a reveal/unlock/confirmation moment.
- First variant is selected by default when a new set appears.

### Regenerate and Share buttons
- **Regenerate**: secondary-button treatment—transparent fill, `1px solid #4f46e5` border, `#eeeeee` text, full-width, 8px radius, directly below the variant stack, 12px top margin.
- **Share**: primary-button treatment—solid `#4f46e5` fill, white text, full-width, 8px radius, directly below Regenerate, 12px top margin.
- Only one solid-fill button is visible at a time (Share); Regenerate stays outline. This follows `BRAND.md`'s existing button rule.
- Both buttons show a disabled/loading state while a request is in flight so the user cannot queue multiple overlapping calls.

### Receiver flow
- Translated message is displayed as the main content, same card/base styling as today.
- Below it, a single **"View original — $1"** button in the secondary-button treatment. Copy is exactly "View original — $1" (em dash, no punctuation flourish). The price is part of the label, visible before the tap, so the receiver knows the cost before committing.
- Tapping it transitions the view to the mock $1 paywall using `BRAND.md`'s unlock/transition blur cross-fade (~220–400ms). The paywall state itself reuses v2/v3 layout and copy.
- Tapping the paywall confirm then reveals the original with the same unlock animation as v2/v3.

### Accessibility
- Variant cards, Regenerate, and Share are all reachable via Tab and operable via Enter/Space.
- Focus outlines are native and visible (do not suppress `outline`).
- Selected card state is not communicated by color alone: the 2px accent border is the visual selection marker; engineer should expose the selected state to assistive tech as a single-select group.

## Acceptance criteria
1. A translate request returns exactly 3 variant strings.
2. Variants render as stacked cards with `#1a1a1a` background, 8px radius, 16px padding, and 12px vertical gap.
3. The first variant is selected by default; selected card has a `2px solid #4f46e5` border, unselected cards have a `1px solid #333` border.
4. Tapping an unselected card selects it and deselects the previously selected card; only one card is selected at a time.
5. The Share action encodes/shares the text of the currently selected variant, not the first variant or any other.
6. Regenerate submits the same raw text, tone, and context as the previous request and returns a new set of 3 variants; the new first variant becomes selected.
7. Tone chip and context input values from v3 are included in every translate/regenerate request body.
8. On `/m/[id]`, the button below the translated message reads exactly "View original — $1" and uses the secondary-button treatment (transparent, accent border, `#eeeeee` text).
9. The price ($1) is visible on `/m/[id]` before the receiver taps the button.
10. Tapping "View original — $1" transitions to the mock $1 paywall state using `BRAND.md`'s unlock/transition blur cross-fade.
11. Tapping the paywall confirm reveals the original with the same animation as v2/v3.
12. All new interactive elements (variant cards, Regenerate, Share) are keyboard-focusable and operable; Tab order follows the visual order.
13. Regenerate and Share are disabled (or show a loading state) while a translate/regenerate request is in flight.
14. The DECLINE guardrail still fires on threat/coercion/self-harm content; share-ID signing, encryption, and sender/unlock localStorage flags are unchanged from v3.
15. The API does not run a separate DECLINE probe before variant generation. The guardrail decision is made only by the post-check in criterion 16 after the 3 variants are generated.
16. After variant generation, if any returned variant starts with the `DECLINE` prefix, the API discards the entire batch and returns `{ declined: true }`; the UI shows the existing DECLINE state and does not display any of the returned variants.

> Note: The pre-generation DECLINE probe was removed during QA because it caused P1 false-positives on benign short messages like "fine". The post-check on actual generated variants still catches threat/coercion/self-harm content without those false positives.
17. `/api/translate` enforces a per-IP rate limit; after the limit is exceeded, subsequent requests return a clean user-facing error and the UI surfaces that error without crashing.
18. `/api/translate` enforces a hard daily spend ceiling; after the ceiling is hit, subsequent requests return a clean user-facing error and the UI surfaces that error without crashing.
19. Regenerate uses the same `/api/translate` endpoint and is subject to the same per-IP rate limit and daily spend ceiling as Translate; there is no separate cap bypass.

## Open questions
None. All questions from `DESIGN.md` and all critic blockers are resolved in this final scope.
