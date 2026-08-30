# v4 Designer Demo — Round 1

**Date:** 2026-08-30  
**Preview:** https://trsl-p3dx2h00h-sangtae-ahns-projects-38b219ff.vercel.app  
**Persona:** product-designer / BRAND.md owner

## What I inspected

- Composer layout, tone chips, context input, Translate loading state.
- Variant cards: stacking, borders, selection, default selection, tap/keyboard selection.
- Regenerate and Share buttons: placement, styling, disabled/loading states.
- Receiver `/m/[id]`: translated message display, "View original — $1" affordance, paywall transition, unlock animation.
- Keyboard navigation through the full composer surface.

## Design / brand taste reaction

The good parts land quietly, which is the right NewJeans-taste note: dark background, single column, system type, restrained motion. Variant cards use the BRAND.md card base (`#1a1a1a`, 8px radius, 16px padding, 12px gap) and the selected/unselected border vocabulary (`#333` 1px vs `#4f46e5` 2px) correctly. Selection swaps instantly, as specified. Keyboard navigation through textarea → chips → context → variants → Regenerate → Share follows the visual order and is operable with Enter/Space. The final unlock animation on `/m/[id]` still reads as "the mask comes off."

Three things break the contract between FINAL.md/BRAND.md and what is deployed:

1. **Two Share affordances in the composer.** After tapping the variant-stack Share button, a second result card appears below with another Share button. The top Share button creates the share server-side but gives no useful completion signal; the bottom Share button is the one that actually copies/opens the link. This is not in FINAL.md ("Share button sends the currently selected variant through the existing signed/encrypted share pipeline" — singular) and it splits a single action into two unclear steps. It also resurrects the old v3 result-card pattern, which v4 was supposed to replace with the variant stack.

2. **Receiver unlock button uses the wrong text color.** Both "View original — $1" and the paywall confirm "Unlock the original — $1" render in `#a5b4fc` (accent text). FINAL.md criterion 8 and BRAND.md's Buttons section specify the secondary/unlock treatment as transparent fill + `#4f46e5` border + `#eeeeee` text. The accent text reads as a link, not a button, and it is the only place in the composer/receiver flow that departs from the `#eee` on transparent button rule.

3. **Paywall transition is flattened into a label swap.** Tapping "View original — $1" changes the button label to "Unlock the original — $1" in the same card, rather than transitioning the view to a distinct mock-paywall state with the blur cross-fade described in FINAL.md. The two-step logic is there, but the curiosity → paywall → reveal rhythm is visually compressed into a single card with two button captions. It still works; it just does not set the floor the design calls for.

## Does it match FINAL.md and BRAND.md?

Partially. The variant cards, selection behavior, tone chips, context input, and unlock animation match. The composer Share flow and the receiver button color/transitions do not.

## Verdict

**hold**

## Concrete issues to fix

1. **Remove the duplicate Share card in the composer.** The variant-stack Share button should be the one and only Share action. After a successful share, give the user the link directly — copy to clipboard + a brief "Copied!" confirmation on the same button (using the existing scale-pulse confirmation animation) — without rendering a second preview card below. The variant stack already shows the selected message; an additional result card is redundant and creates two buttons with the same label.

2. **Fix receiver secondary-button text color.** Change "View original — $1" and "Unlock the original — $1" text from `#a5b4fc` to `#eeeeee`, per BRAND.md's secondary-button treatment.

3. **Strengthen the paywall transition (optional for this round, but preferred).** Separate the locked and paywall states visually — e.g., blur cross-fade the locked card out and the paywall card in, or at minimum restate the cost and confirm action as a distinct card. If the flattened label-swap is kept as a deliberate simplification, document it as a deviation in FINAL.md; otherwise implement the transition described in the acceptance criteria.

Once #1 and #2 are fixed, this is shippable. #3 can ride along if the engineer fix for #1 leaves the surface easy to touch; otherwise it can be a backlog polish item.
