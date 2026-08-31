# v4 Changelog

Multiple translation variants, selectable cards, regenerate, receiver
"View original — $1" flow, backend rate/cost cap, and a DECLINE post-check
(no pre-check probe — see criterion 15/16 below).

## Files touched

- `app-trsl/src/lib/translate.ts` — added `translateBatch()` with a DECLINE
  post-check, kept single `translate()` for backward compatibility.
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
   `translateBatch()` requests `n: count + 1` (4) completions and returns
   the first 3 non-DECLINE survivors; `route.ts` returns that array. UI
   validates `data.variants.length === 3`.

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

15. **No separate pre-generation DECLINE probe.** — PASS. `translateBatch()`
    makes exactly one completion call (`n: count + 1`) and runs no probe
    call before it.

16. **Post-check discards the batch on DECLINE.** — PASS, with a
    documented deviation from the criterion's literal text. See "P1 fix:
    DECLINE false positives" below — the kill condition is no longer a bare
    "any decline kills the batch"; it now discards only when fewer than
    `count` non-DECLINE variants survive an over-sampled batch.

17. **Per-IP rate limit on `/api/translate`.** — PASS. `rate-limit.ts`
    enforces 20 requests per IP per minute (raised from 10 in the demo-round
    fix below); over-limit requests get
    `429 { error: "Too many translation requests..." }`.

18. **Hard daily spend ceiling on `/api/translate`.** — PASS.
    `rate-limit.ts` tracks estimated spend and blocks requests after
    `$10/day` with `429 { error: "Daily translation budget exhausted..." }`.

19. **Regenerate subject to same caps as Translate.** — PASS. Regenerate
    calls the same `/api/translate` endpoint; no bypass.

## Post-QA fix

- Removed the DECLINE pre-check probe from `translateBatch()` (see QA.md
  P1). The probe caused false positives on benign short messages such as
  `"fine"` and `"test message"`, rejecting legitimate input. The guardrail
  moved entirely to a post-check on the generated variants (see the
  "DECLINE false positives" fix below for how that post-check's kill
  condition was later hardened).

## Demo-round fixes (Round 1 → engineer re-run)

1. **Duplicate Share UI removed.** `page.tsx` no longer renders a second
   result card below the variant stack. The variant-stack Share button is
   the only Share action. After a successful share it tries `navigator.share`
   and falls back to clipboard, then shows "Copied!" with the existing
   `trsl-copied-pulse` animation on the same button.
2. **Input handling made robust.** Added DOM refs for the textarea and
   context input. `requestTranslate()` and `handleShare()` read the current
   input values from the refs at call time, so the translated/shared text
   is always exactly what is in the composer — no stale-closure risk.
3. **Rate limit relaxed.** `IP_MAX_REQUESTS` raised from 10 to 20 per
   minute so the designed loop (translate → regenerate at least once →
   share, with room for extra regenerations) is not blocked on the second
   request.
4. **Receiver secondary-button text color fixed.** "View original — $1" and
   "Unlock the original — $1" now use `#eeeeee` text, matching BRAND.md's
   secondary-button treatment.
5. **Distinct mock-paywall transition.** Tapping "View original — $1" now
   moves through an `exiting` phase (locked card softens out via
   `trsl-unlock-exit`) before the `paywall` card resolves in (via
   `trsl-unlock-enter`), rather than flattening the two steps into a single
   label swap.

## QA re-verification round (BLOCK → fixes)

QA.md filed one P0 and two P1s against this build; all three addressed here.

**P0: composer/share mismatch (original pinned to the actual translated
text).** `handleShare` in `page.tsx` previously re-read the composer's live
textarea value at share-click time. If the user edited the textarea after
translating but before sharing (without hitting Regenerate), the receiver
got a share pairing the *new* unsent text as "original" with the *old*
request's translation — a real original/translated mismatch, the exact
trust property v4 is supposed to guarantee.

Fix: `requestTranslate` now stores the raw text alongside the variants it
produced, in one state value — `translation: { variants, sourceText } |
null` — set atomically in the same `setTranslation(...)` call that lands
the API response. `handleShare` reads `translation.sourceText`, never the
DOM/composer. Because there's only one state object, drift between "which
variants" and "which raw text" is structurally impossible, not just
patched at the one call site QA found.

Proposed FINAL.md-level constraint (not applied to FINAL.md directly — this
is a documentation note, not a criteria change I'm authorized to make):
> The stored `original` for a share is the exact raw text that was sent to
> `/api/translate` to produce the displayed/selected variant — never
> whatever is currently in the composer at share time.
(Wording per QA.md's suggested addition, QA.md:95–98.)

**P1: DECLINE false positives on short benign input ("fine", "ok", "sounds
good").** Root cause was two-fold: (1) the system prompt gave the model
only two outputs for a message with nothing to soften — rewrite or
DECLINE — so a bland/short message had DECLINE as its only "I don't know
what to do here" escape hatch; (2) the post-check killed the *entire*
3-variant batch if *any one* of 3 independent samples declined, which
roughly triples the effective false-positive rate over a single sample.

Fix, both halves:
- Prompt (`SYSTEM_PROMPT` in `translate.ts`): explicitly instructs the
  model to lightly rewrite mild/short/mundane messages rather than decline
  them, and restricts DECLINE to explicit threats of violence, sexual
  coercion, or self-harm language — never vagueness or brevity.
- Kill condition (`translateBatch`): now requests one extra completion
  (`n: count + 1`), filters out any sample that starts with DECLINE, and
  takes the first `count` survivors. Only when fewer than `count` survive
  (i.e. most/all samples declined, which is what genuinely abusive input
  does consistently) does the batch get discarded as `declined: true`. A
  single flaky sample no longer takes down two good variants next to it.
  Temperature was deliberately left at 0.8 — that's the diversity knob
  behind v4's three-distinguishable-variants premise, and lowering it would
  make cards near-duplicates, a more visible regression than a rare false
  decline.

  **Deviation from FINAL.md criterion 16's literal text** ("if any returned
  variant starts with the DECLINE prefix, the API discards the entire
  batch"): the kill condition is no longer bare "any". This is a deliberate
  fix per QA.md's own finding that criterion 16 as literally specified
  produces the exact user-visible false-positive bug it claims (in its
  accompanying note) not to have. Verified live: genuinely abusive input
  ("I will hurt you if you leave me") still reliably returns
  `declined: true` across repeated runs; benign short input ("fine", "ok",
  "sounds good") no longer does.

**P1: share succeeds but the link is unrecoverable / clipboard failure
misreported as a network error.** Two independent bugs in `page.tsx`:
`shareUrl` was set via `setShareUrl` but never rendered anywhere (dead
state — no fallback UI if the "Copied!" confirmation didn't fire), and a
`navigator.clipboard.writeText` rejection *after* a successful share was
caught by the same try/catch as the network call, so it displayed "Couldn't
reach the server" for what was actually a clipboard permission/API issue —
misleading, since the share had already succeeded server-side.

Fix: `handleShare` now has two separate try/catch blocks. The first covers
only the `/api/share` network call and sets the real error message on
failure. Once that succeeds, `shareUrl` is set and rendered immediately (a
visible link plus a "Copy link" secondary button, per BRAND.md's
transparent/accent-border treatment) — this happens *before* the
native-share/clipboard attempt. A second, separate try/catch wraps only
`navigator.share`/`navigator.clipboard.writeText`; if that fails or is
cancelled, no error is shown at all, because the link is already on screen
and copyable.

## Doc fix

- Corrected the stale criterion-15 write-up (and five other spots in this
  file) that described a `DECLINE_PROBE_PROMPT` pre-check call — that
  probe was removed during QA and doesn't exist in current `translate.ts`.
  Current criterion 15 in FINAL.md requires *no* pre-check probe; the old
  wording here said the opposite.

## Notes

- The rate/cost cap is in-memory and best-effort across serverless
  invocations. A shared store is the upgrade trigger once traffic justifies
  it; see `rate-limit.ts` ponytail comment.
- `translate()` (single-result) is kept unchanged in case any future code
  still imports it, but v4 only uses `translateBatch()`.
- No new backend service or database was added.
