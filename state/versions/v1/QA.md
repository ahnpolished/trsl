# v1 QA

> **Amendment (post-release):** references below to Vercel KV / Upstash
> Redis storage are stale. That mechanism was replaced with a stateless
> approach — the share payload is HMAC-SHA256-signed and encoded directly
> into the URL, no server-side storage at all. See `FINAL.md` and
> `CHANGELOG.md` in this directory for the current mechanism and the two
> commits that made the change ("app-trsl: encode share payload into URL,
> drop KV dependency" and "Sign share-id payloads with HMAC-SHA256").

Tested against `state/versions/v1/FINAL.md` acceptance criteria, against the
actual running app at `app-trsl/` (`npm install`, `npm run build`, `npm run
start`), not just the changelog. HTTP calls made with Node's `fetch` (curl
was blocked by sandbox permissions) against the live local server.

**This pass is a re-check of the P1 fix in commit `85f8df2`** (engineer
changed the DECLINE guardrail in `src/lib/translate.ts` from
`text.trim() === "DECLINE"` to `text.toUpperCase().startsWith("DECLINE")`).
Full re-run of all criteria below, not just criterion 4, to check for
regressions from the change.

No real `ANTHROPIC_API_KEY` exists in this sandbox, but rather than stop at
"blocked" for every criterion that touches the translate call, the LLM call
was stubbed: `next start` was run with `ANTHROPIC_BASE_URL` pointed at a
tiny local mock HTTP server (`/v1/messages`, with a `/__set` control
endpoint to change the mock's returned text per request) that returns a
valid Anthropic Messages API response shape. This exercises the app's real
request/response handling, storage, and UI-state logic end to end — it does
**not** exercise the real model's judgment on tone-softening or what counts
as a threat, which stays blocked on a live key.

`npm run build` succeeds cleanly (Next.js 15.5.24, no type errors, no lint
failures).

## P1-1 re-verification (this pass's focus)

Repro from the prior block, replayed against the live app on the fixed code:

| Mock model output | Expected | Result |
|---|---|---|
| `DECLINE` | declined, no id | `200 {"declined":true}` — PASS |
| `DECLINE.` (the exact P1 repro — trailing punctuation) | declined, no id | `200 {"declined":true}` — **PASS, fixed** |
| `Decline.` (lowercase + punctuation) | declined, no id | `200 {"declined":true}` — PASS |
| `decline` (lowercase only) | declined, no id | `200 {"declined":true}` — PASS |
| `DECLINE\n(explanation)` (token + trailing text) | declined, no id | `200 {"declined":true}` — PASS |
| `DECLINEX` (token as a substring prefix of a longer word) | declined, no id | `200 {"declined":true}` — declines; over-broad but fail-closed, see note below |
| `This is fine, not declining.` (normal translation) | translated, id issued | `200 {"id":"...","translated":"This is fine, not declining."}` — PASS |

The exact repro from the P1 report — mock returns `"DECLINE."` — now
correctly returns `{"declined":true}` with no `id` and no share link
created. Confirmed live against the running server, not just read from the
diff.

**Note (not a bug):** the prefix match means any model output that happens
to *start* with the literal characters "decline" (e.g. a hypothetical
`DECLINEX...`) would also be treated as a refusal, even if that wasn't the
model's intent. This is the correct tradeoff for a safety guardrail
(fail-closed over fail-open) and matches FINAL.md's updated mechanism
description verbatim ("starts with `DECLINE`, tolerates trailing
punctuation or explanatory text"). Not filed as a bug.

**Regression check:** happy-path translate → share flow re-tested after the
fix (mock returns an ordinary sentence) — `/api/translate` still issues a
UUID and stores the message, `/m/<uuid>` still renders the translated text
with a 200. No regression from the guardrail change.

## Criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Single textarea + Translate button, no login | **PASS** | Home page HTML contains `<textarea`, "Translate" button text, no login/signup/sign-in strings anywhere. |
| 2 | Translate calls Claude API; loading state; failed call shows error state, not blank/broken screen | **PASS** | Error path: POST `/api/translate` with no key set → clean `502 {"error":"Server is missing ANTHROPIC_API_KEY."}`, no crash. Happy path (via mock): POST returns `200` with `{id, translated}`. |
| 3 | >1000 chars rejected client + server, no API call, no link | **PASS** | Textarea has `maxLength={1000}`. Server route independently checks `text.length > MAX_CHARS` (1000), returns 400, no API call reached. |
| 4 | Threats/coercion/self-harm input → decline state, no share link | **PASS (fixed)** | Was **FAIL** in the prior block (P1-1): exact-equality match on `"DECLINE"` failed open on `"DECLINE."` (trailing punctuation), issuing a share link for declined content. Re-tested live against the fixed code (`text.toUpperCase().startsWith("DECLINE")`): the exact repro (`"DECLINE."`) and five other punctuation/case/trailing-text variants all now correctly decline with no `id` and no share link. See table above. |
| 5 | Post-translate share action reachable with no extra navigation | **PASS** | Successful translate returns `{id, translated}` in the same request/response the UI renders inline (`page.tsx` renders the Share button unconditionally on `result` state, no route change). |
| 6 | `/m/<uuid>` loads fresh, no login/paywall | **PASS** | Fetched `/m/<uuid>` for an ID produced by a live (mocked) translate call: `200`, full translated text present in body HTML, no auth check. Unknown ID → `404` (`notFound()`). |
| 7 | `noindex` meta tag on share page | **PASS** | Rendered HTML head contains `<meta name="robots" content="noindex, nofollow"/>`. |
| 8 | Rich OG preview (generic title/description, static image), never raw message text | **BLOCKED** | Tags verified correct: share page head has `og:title="trsl"`, `og:description="Someone sent you a message via trsl."`, `og:image=".../og-image.png"` — no message text in metadata. `/og-image.png` serves `200`, `image/png`, 1200×630. Criterion as written names the actual unfurl (iMessage / Facebook Sharing Debugger / Twitter Card Validator), which requires a real public deploy — **blocked**, needs deploy (unchanged from prior block, not related to the P1 fix). |
| 9 | UUID v4 IDs, no collisions, not content/time-derived | **PASS** | Distinct mocked translate calls produced distinct IDs matching the UUID v4 regex. `randomUUID()` called once server-side per success, used directly as storage key and URL segment. |
| 10 | Full flow on a real deployed URL, mobile + desktop | **BLOCKED** | No deploy target, no real `ANTHROPIC_API_KEY`, no KV creds in this sandbox. Everything short of the live deploy boundary (build, routing, storage, guardrail wiring — now fixed and re-verified, meta tags, error handling, mocked happy-path round trip) is verified above. Unchanged from prior block. |

## Edge cases exercised beyond the numbered list

- Empty string / whitespace-only body → `400 "Message can't be empty."`, no crash.
- Missing `text` field, invalid JSON body → clean `400`s, no crash.
- `GET /api/translate` (wrong method) → `405`, framework default, no crash.
- DECLINE guardrail punctuation/case/trailing-text variants (this pass's
  focus) — see table above, all decline correctly.
- File-based dev storage fallback (`.data/messages.json`) round-trips
  correctly for read/write; already flagged by engineer as **not viable on
  Vercel's serverless filesystem** — must be replaced by real KV creds
  before deploy, tracked in README, not a code defect.

## Bugs

None open. P1-1 (DECLINE guardrail exact-match fail-open) from the prior
block is **fixed and re-verified live** — see re-verification table above.

**P2 — no explicit request timeout on the Claude call.** (carried forward,
unchanged, not re-tested this pass — no timeout-related code touched by the
P1 fix.)
`translate.ts` has no `AbortController`/timeout override on the Anthropic
call; it inherits the SDK's 10-minute default. Backlog item.

**P2 — `og-image.png` is a placeholder, not a branded asset.** (carried
forward, unchanged.) Already flagged by the engineer as a pre-ship
checklist item. Not a code defect.

## Blocked items (not code defects — need a human to supply secrets/deploy)

Unchanged from the prior block — not affected by the P1 fix:

- **Criterion 8's real-unfurl test** — needs a real Vercel deploy (public
  URL) for iMessage/Facebook Sharing Debugger/Twitter Card Validator to
  fetch. Tags themselves verified correct.
- **Criterion 10** — needs a real deploy plus real `ANTHROPIC_API_KEY` and
  KV creds (`KV_REST_API_URL`/`KV_REST_API_TOKEN`) for persistence to
  survive Vercel's serverless filesystem, and a real mobile device/browser.
- **Real model judgment** (does Haiku actually produce a "honest but kind"
  rewrite, does it correctly recognize threats/coercion/self-harm in
  practice, does it reliably start refusals with the literal word
  "DECLINE") is inherently untestable without a live key — the mock
  confirms the app's plumbing around whatever the model returns, not the
  model's judgment or compliance with the system prompt's instruction.

Both the deploy and the API key are explicitly listed in
`app-trsl/README.md` as what a human must supply.

## Should FINAL.md's acceptance criteria have prevented anything?

For P1-1 (prior block): yes, and it's now closed on both sides — FINAL.md's
mechanism description was updated in the same commit as the code fix to
specify the prefix-match/tolerance behavior explicitly, so the spec and
implementation are now aligned. No new spec gaps found this pass.

## Verdict

**Ship.**

The one open P1 from the prior block (DECLINE guardrail fails open on
non-exact model output) is fixed and re-verified live against the running
app, including the exact repro string (`"DECLINE."`) plus five adjacent
variants — all now correctly decline with no share link created. Full
regression pass across all 10 criteria found no new P0/P1s and no
regression in the happy-path translate → share flow from this change.
`npm run build` is clean.

The two blocked criteria (8's real-unfurl test, 10's full real-deploy flow)
remain non-blocking per the prior block's scope — they require secrets/a
deploy target this sandbox doesn't have, not a code fix. The two P2s (no
request timeout, placeholder og-image) are backlog, not blockers.
