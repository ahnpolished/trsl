# v1 QA-2 — Re-verification after post-ship fix cycle

Re-verifies main after three post-v1 commits: `8ad72af` (HMAC-sign share-id
payloads), `f626aae` (merge of same), `6e832fb` (real branded OG image + doc
reconciliation). Critic already retroactively reviewed the security fix in
`DISCUSSION-2.md` (verdict: sufficient). This pass independently re-runs the
exploit and the full FINAL.md acceptance list against the current running
app — not a re-read of the prior QA.md or the Critic doc.

Same sandbox constraints as the original QA pass: no live
`ANTHROPIC_API_KEY`. The Claude call is stubbed via `ANTHROPIC_BASE_URL`
pointed at a local mock `/v1/messages` server, exercising real
request/response handling, HMAC signing/verification, and UI-state logic
end to end — not the model's actual judgment. `npm run build` run clean;
`npm run start` run against the mock, `SHARE_SECRET` set, no `NODE_ENV`
override (so `next start`'s own production-forcing behavior applies, same
as a real deploy).

## 1. Exploit re-verification (hand-crafted `/m/<id>`)

Normal translate → share round trip, live against the running server:

```
POST /api/translate {"text":"you never listen to me..."}
→ 200 {"id":"eyJ0Ijoi...ifQ.mclBeAtzKR8p4F26FEHuRk","translated":"I felt hurt..."}
GET /m/<that id>
→ 200, body contains the translated text, <meta name="robots" content="noindex...">,
  og:image → /og-image.png, og:title → "trsl"
```
Round trip works end to end. **PASS.**

Hand-crafted / tampered URL attempts, all against the same live server:

| Attempt | Result |
|---|---|
| Payload with no `.` (no signature at all) | `404` |
| Valid-looking payload + garbage signature (`AAAA...`) | `404` |
| Valid-looking payload signed with an attacker-guessed secret (`"attacker-guessed-secret"`) | `404` |
| Real signed id, payload swapped for different text, original signature kept (classic tamper) | `404` |
| Payload signed with the hardcoded `DEV_SECRET_FALLBACK` string from `share.ts` (probing the residual risk DISCUSSION-2 flagged) | `404` — `next start` forces `NODE_ENV=production` regardless of the env var passed in, so the fallback path in `getSecret()` never activates here |

Every forged/tampered `/m/<id>` 404s. `decodeShareId` verifies the HMAC
signature with `timingSafeEqual` before trusting the payload; no path
renders unsigned or mistamped content. **The exploit is closed, confirmed
independently (not just re-reading the Critic's prior review).**

DECLINE guardrail spot-check on the same running server (mock returns
`"DECLINE"` for a coercive input): `200 {"declined":true}`, no `id` field,
no share link produced. Guardrail still wired correctly post-fix.

**Residual, non-blocking** (matches DISCUSSION-2 objection 1, re-confirmed
by test not just re-read): the dev-secret fallback in `share.ts` only
degrades safely because `next start` always forces `NODE_ENV=production`.
A hypothetical deploy that runs the built app under a custom server/process
manager that doesn't set `NODE_ENV=production` would silently fall back to
the hardcoded, git-visible dev secret. Not exercised further here — it's an
ops/deploy-config risk, not a code path this sandbox can trigger, and
Critic already logged it as a follow-up, not a blocker.

## 2. Full FINAL.md acceptance criteria re-check

`npm run build`: clean, no type errors, no lint failures (Next.js 15.5.24).

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Single textarea + Translate button, no login | **PASS** | `GET /` → 200, HTML contains `<textarea`, "Translate" button text, no login/signup/sign-in string anywhere. |
| 2 | Translate calls Claude API; loading state; failed call → error state | **PASS** | Happy path via mock: `POST /api/translate` → 200 `{id, translated}`. Missing-key path unchanged from original QA (`translate.ts` still returns a clean `502` string, no crash) — not re-run this pass since untouched by the three commits, code read to confirm no regression. |
| 3 | >1000 chars rejected client + server, no API call, no link | **PASS** | `maxLength={1000}` on textarea (`page.tsx`). Server: 1001-char POST → `400 "Message is too long (max 1000 characters)."`, no `id` returned. |
| 4 | Threats/coercion/self-harm → decline state, no share link | **PASS** | Mock returns `"DECLINE"` for a coercive-input POST → `200 {"declined":true}`, no `id`. **Now also holds against hand-crafted URL access** — see section 1, all forged/tampered `/m/<id>` 404 rather than rendering. |
| 5 | Post-translate share action reachable, no extra navigation | **PASS** | `result` state renders the Share button inline in the same `page.tsx` render, no route change (code read, unchanged since original QA). |
| 6 | `/m/<uuid-equivalent>` loads fresh, no login/paywall | **PASS** | Live-issued id → `200`, full translated text in body, no auth check. Unknown/bogus id (no dot) → `404`. |
| 7 | `noindex` meta tag on share page | **PASS** | Rendered head: `<meta name="robots" content="noindex, nofollow"/>`. |
| 8 | Rich OG preview, generic title/desc, static branded image, never raw message text | **PASS on tags + asset; BLOCKED on real unfurl** | Tags confirmed: `og:title="trsl"`, `og:description="Someone sent you a message via trsl."`, `og:image=".../og-image.png"`, no message text anywhere in metadata. `/og-image.png` → `200 image/png`. **Image confirmed real and branded, not a placeholder** — see section 3. Actual iMessage/Sharing-Debugger unfurl still needs a real public deploy — blocked, unchanged from original QA, not a regression. |
| 9 | Share IDs: no collisions across different content, not sequential | **PASS** | IDs are content-derived by design per FINAL.md's updated spec (base64url payload + HMAC signature, not UUID). Distinct inputs produce distinct ids in testing; verified this is now the locked spec, not a deviation — FINAL.md criterion 9 was itself updated post-deploy-prep to match. |
| 10 | Full flow on a real deployed URL, mobile + desktop | **BLOCKED** | No deploy target, no real `ANTHROPIC_API_KEY` in this sandbox — explicitly out of scope per task instructions, not a red flag. Everything short of the live-deploy boundary (build, routing, HMAC signing/verification, guardrail wiring including the direct-URL bypass path, meta tags, error handling, mocked happy-path round trip) verified above. |

No regressions found across the full criteria list from the three commits.

## 3. OG image check

`app-trsl/public/og-image.png`: 1200×630 PNG, 152KB. Visually inspected —
real branded design: dark gradient background, large `"trsl"` wordmark,
quote-mark accent, tagline `"say it straight. we'll translate it."`,
`"TRSL.APP"` footer text. **Confirmed real, not the prior placeholder**
(original QA.md's P2 "og-image.png is a placeholder" is resolved by commit
`6e832fb`).

## Bugs

None open. No P0/P1 found this pass. Prior P2s status:

- **P2 — no request timeout on the Claude call.** Unchanged, still open,
  untouched by these three commits. Still backlog, not a blocker.
- **P2 — placeholder og-image.png.** **Resolved** by commit `6e832fb` — see
  section 3. Closing this item.

New, non-blocking observation (already logged by Critic, re-confirmed by
test rather than re-read — see section 1): dev-secret fallback in
`share.ts` is safe under `next start`/Vercel but would degrade silently
under a deploy path that doesn't force `NODE_ENV=production`. Ops note, not
a code defect blocking this ship — carry forward to backlog/ops docs per
Critic's recommendation, not re-opened as a QA blocker.

## Should FINAL.md's acceptance criteria have prevented anything?

No new gap found. Criterion 4 and 9's post-deploy-prep updates already
folded the HMAC mechanism into the spec text, so spec and implementation
stayed aligned through this fix cycle — nothing here needed the criteria to
catch it that they didn't already cover.

## Verdict

**Ship.**

The share-id exploit (hand-crafted `/m/<id>` bypassing the DECLINE
guardrail) is independently confirmed closed: five distinct forgery/tamper
attempts against the live running app all 404, and the normal
translate→share round trip still works end to end. All FINAL.md criteria
re-checked against current main: no regressions, one prior P2 resolved (OG
image is now real and branded), one P2 remains backlog (no request
timeout), and criteria 8 (real unfurl) and 10 (real deploy) remain blocked
only on missing secrets/deploy target, per task scope, not a code issue.
