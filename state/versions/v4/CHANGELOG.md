# v4 Changelog

Multiple translation variants, selectable cards, regenerate, receiver
"View original — $1" flow, backend rate/cost cap, and DECLINE pre/post
checks.

## Files touched

- `app-trsl/src/lib/translate.ts` — added `translateBatch()` with DECLINE
  pre-check and post-check, kept single `translate()` for backward
  compatibility.
- `app-trsl/src/lib/rate-limit.ts` — new in-memory per-IP rate limiter and
  daily spend ceiling.
- `app-trsl/src/app/api/translate/route.ts` — rate-limit check, calls
  `translateBatch()`, returns `{ variants }` or `{ declined: true }`.
- `app-trsl/src/app/api/share/route.ts` — new endpoint that encodes the
  selected variant + original into a share id.
- `app-trsl/src/app/page.tsx` — variant cards, regenerate, share via
  `/api/share`, disabled/loading states.
- `app-trsl/src/app/m/[id]/ShareView.tsx` — "View original — $1" button,
  paywall confirmation step, then existing unlock reveal.

## Acceptance criteria

1. **Translate request returns exactly 3 variant strings.** — PASS.
   `translateBatch()` calls the model with `n: 3` and `route.ts` returns the
   resulting array. UI validates `data.variants.length === 3`.

2. **Variants render as stacked cards with `#1a1a1a` background, 8px radius,
   16px padding, 12px vertical gap.** — PASS. `CARD_BASE` and the parent
   flex column in `page.tsx` match BRAND.md exactly.

3. **First variant selected by default; selected border `2px solid #4f46e5`,
   unselected `1px solid #333`.** — PASS. `selectedIndex` initializes to 0
   and the card border switches on `index === selectedIndex`.

4. **Tapping an unselected card selects it; single-select only.** — PASS.
   `onClick` sets `selectedIndex` to the clicked index.

5. **Share encodes the currently selected variant.** — PASS. `handleShare`
   sends `variants[selectedIndex]` to `/api/share`, which calls
   `encodeShareId(translated, original)`.

6. **Regenerate submits the same raw/tone/context and returns a new set of 3
   variants; first selected.** — PASS. Regenerate reuses `requestTranslate`,
   which reads from the same `input`, `tone`, `context` state and resets
   `selectedIndex` to 0.

7. **Tone chip and context input included in every translate/regenerate
   request.** — PASS. Both are in the POST body sent by `requestTranslate`.

8. **Receiver button reads exactly "View original — $1" with secondary-button
   treatment.** — PASS. Copy and styling match FINAL.md.

9. **Price ($1) visible before receiver taps.** — PASS. The price is in the
   button label on the initial receiver screen.

10. **Tapping "View original — $1" transitions to mock paywall state using
    blur cross-fade.** — PASS. The paywall `div` uses
    `className="trsl-unlock-exit"` and the existing CSS transition.

11. **Paywall confirm reveals original with same animation as v2/v3.** —
    PASS. Unlock flow reuses the existing `processing → exiting → revealed`
    path with `trsl-unlock-enter`.

12. **New interactive elements keyboard-focusable and operable.** — PASS.
    Variant cards have `tabIndex={0}`, `role="radio"`, `aria-checked`, and
    Enter/Space handlers; chips and inputs already had focus outlines in v3.

13. **Regenerate and Share disabled/loading while request in flight.** —
    PASS. Both buttons set `disabled={isBusy}` and apply the processing
    pulse class.

14. **DECLINE guardrail still fires on threat/coercion/self-harm; share
    encryption/flags unchanged.** — PASS. `translateBatch` keeps the same
    guardrail logic; `share.ts` and `client-flags.ts` are untouched.

15. **Pre-check: one DECLINE probe on combined input before variants.** —
    PASS. `translateBatch()` makes a probe call with
    `DECLINE_PROBE_PROMPT` before the main `n: 3` call.

16. **Post-check: any DECLINE variant discards the whole batch.** — PASS.
    After generation, `variants.some(startsWithDecline)` returns declined if
    any variant is flagged.

17. **Per-IP rate limit on `/api/translate`.** — PASS. `rate-limit.ts`
    enforces 10 requests per IP per minute; over-limit requests get
    `429 { error: "Too many translation requests..." }`.

18. **Hard daily spend ceiling on `/api/translate`.** — PASS.
    `rate-limit.ts` tracks estimated spend and blocks requests after
    `$10/day` with `429 { error: "Daily translation budget exhausted..." }`.

19. **Regenerate subject to same caps as Translate.** — PASS. Regenerate
    calls the same `/api/translate` endpoint; no bypass.

## Notes

- The rate/cost cap is in-memory and best-effort across serverless
  invocations. A shared store is the upgrade trigger once traffic justifies
  it; see `rate-limit.ts` ponytail comment.
- `translate()` (single-result) is kept unchanged in case any future code
  still imports it, but v4 only uses `translateBatch()`.
- No new backend service or database was added.
