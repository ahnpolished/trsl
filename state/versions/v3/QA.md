# v3 QA

Independent re-verification of engineer's CHANGELOG.md against FINAL.md's
10 acceptance criteria. App run for real (`npm run dev`, real
`OPENAI_API_KEY`/`SHARE_SECRET`), driven with `browser-use` (chip
interaction, keyboard nav, computed styles) and live `fetch()` calls from
the browser context for server-side checks (direct POST bypass, reveal,
forged ids). No criterion taken on the changelog's word alone.

## Results

| # | Criterion | Result |
|---|-----------|--------|
| 1 | Empty state byte-identical to pre-v3 (`context`/`tone` omitted, system prompt unchanged, user message = raw) | PASS — captured live `messages` array via temporary instrumentation (reverted after use): system prompt matched `SYSTEM_PROMPT` verbatim, user content was raw text unchanged. |
| 2 | Tone chip → system prompt gets `TONE_PROMPTS[tone]` clause | PASS — live call with `tone: "boundary"` produced `SYSTEM_PROMPT + "\n\nTone the sender wants: " + TONE_PROMPTS.boundary` exactly. |
| 3 | Context → appended to user message only, never touches system prompt | PASS — live call produced user content `raw + "\n\n[context: " + context + "]"`; system prompt untouched. |
| 4 | 200-char cap, client (`maxLength`) **and** server | PASS both sides — DOM `maxlength="200"` confirmed on the input; direct `fetch()` POST with a 201-char context (bypassing the client entirely) returned `400 {"error":"Context is too long (max 200 characters)."}` before any OpenAI call. |
| 5 | Chip single-select (re-tap deselects, second tap swaps) | PASS — selecting a 2nd chip deselected the 1st (verified via computed `background-color`); re-clicking a selected chip returned it to transparent. |
| 6 | v2 regression: `/m/[id]`, reveal, forged-id 404s unaffected | PASS — full live flow: translated with context set → `/m/[id]` rendered correctly, RSC payload contains only `id`/`translated` (no leak of context/tone anywhere in the HTML) → `/api/reveal/[id]` returned the correct original → forged id on both `/m/[id]` and `/api/reveal/[id]` returned 404. `share.ts` untouched per changelog, confirmed behaviorally. |
| 7 | Translate button enabled state depends only on main textarea | PASS — selected a chip + filled context with textarea empty; button stayed disabled. |
| 8 | DECLINE fires from abusive `context` alone with benign `raw` (critic's abuse-surface concern) | PASS — live call: `text: "we need to talk tonight"`, `context: "I want to kill myself if he leaves me"` → UI showed decline state, confirmed via captured messages array that the concatenation (not just raw-message path) is what the guardrail sentence caught. |
| 9 | Keyboard operable, visible focus outlines (chips + context input) | PASS — Tab order textarea → 5 chips → context input, each element showed native `outline-style: auto` (not suppressed). Enter toggled a focused chip on; Space toggled it back off. |
| 10 | Chip visual states match BRAND.md's Chips entry exactly | PASS — unselected: `background: transparent`, `color: rgb(238,238,238)`, `border: 1px solid rgb(79,70,229)`. Selected: `background: rgb(79,70,229)`, `color: rgb(255,255,255)`. `box-shadow: none` both states. No CSS transition defined (instant swap). Layout screenshot matches DESIGN.md's placement spec (textarea → counter → chip row → context input → button, 12px gaps). |
| — | Tone actually changes output character (product-taste check) | PASS — same raw message ("I feel like you never make time for me anymore and it hurts") translated under gentle/honest/boundary/playful produced 4 genuinely distinct outputs — gentle led with reassurance, honest was plainer/blunter, boundary used firmer "I need to express..." framing, playful opened with "Hey love" and lighter language. Not a template swap with the same skeleton. |
| — | `npm run build` | PASS — compiles clean, 0 type errors, all 5 routes generated. |

Context input placeholder color also independently confirmed at exactly
`rgb(136,136,136)` (`#888`), matching BRAND.md.

## Bugs

None found at P0/P1/P2. No open issues.

## FINAL.md criteria quality note

Criteria 1–8 and 10 were specific enough (exact string equalities, exact
RGB values) that verification was mechanical and unambiguous — no design
defect to flag here. Criterion 9's phrasing ("visible native focus
outlines") was slightly loose (doesn't pin down *which* CSS property
counts as "visible"), but it held up fine under a straightforward keyboard
walkthrough and didn't cause any back-and-forth during testing.

## Verdict

**ship** — all 10 acceptance criteria pass, live-verified independently
(not taken from CHANGELOG.md's word), no P0/P1/P2 bugs.
