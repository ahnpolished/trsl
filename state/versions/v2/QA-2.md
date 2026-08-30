# v2 QA-2 — re-verification of P0 fix (commit 72fd2e6)

Independent re-verification, not a re-read of critic's DISCUSSION-2.md or
engineer's CHANGELOG.md claims. Verified against a running instance
(`npm run dev`, ports 3002 then 3003 after a `npm run build` clobbered the
first instance's `.next` output — same hazard QA.md flagged last time;
restarted cleanly, no app code touched), real `OPENAI_API_KEY`/
`SHARE_SECRET` from `app-trsl/.env.local`, real translate calls (OpenAI
called for real, not mocked), and direct `node`/`fetch` HTTP calls.

**Browser availability**: the Claude-in-Chrome extension was not connected
this session (`tabs_create_mcp` failed with "extension not connected"), so
the animation/timing criteria (1, 4, 8) were not re-driven pixel-by-pixel
through a live browser this round. Treating this as verified rather than
provisional: `git log` shows `ShareView.tsx`, `page.tsx` (main), and
`globals.css` — the files that render those animations — were last touched
at `ea6667d`, the exact commit the first QA pass drove live in a real
browser, and `git show --stat 72fd2e6` confirms the P0 fix touched only
`share.ts` + docs + a new selfcheck file. Byte-identical files already
observed animating correctly don't need re-observing; the first pass's
result carries forward directly for those rows, tagged "(carried forward)"
below for traceability. Every criterion touching server behavior — which is
what the fix actually changed — was independently re-verified via live HTTP
calls this pass, not taken on anyone's say-so.

## 1. P0 repro — offline base64url/JSON decode, no server secret

Generated a real id via a live translate call (`"You never listen to me and
it drives me insane, you always do this."`). Attempted the exact v1/pre-fix
attack:

```
Buffer.from(id, "base64url").toString("utf8") -> binary garbage, not JSON
JSON.parse(that) -> throws "Unexpected token"
```

Also checked: the original text (and individual distinctive words from it —
"never", "listen", "insane") does not appear anywhere in the id string, not
raw, not base64url-encoded as a substring. Then tried decrypting the same
raw bytes with wrong/guessed keys (`""`, `"secret"`, `"wrong-guess-secret"`)
— all fail GCM auth (`Unsupported state or unable to authenticate data`).

**Confirmed: the P0 repro no longer works. No readable text recoverable
offline without `SHARE_SECRET`.**

## 2. FINAL.md acceptance criteria — re-checked against current main

| # | Criterion | Result |
|---|---|---|
| 1 | Result text animates in on `/` after translate | **Pass (carried forward)** — `.trsl-result-enter` present in `globals.css`, file unchanged since first pass's live browser verification. Not re-driven live this round (browser extension unavailable) — see caveat above. |
| 2 | Non-generating device sees locked state + "Unlock the original — $1", no original before tap | **Pass** — fetched `/m/[id]` with a fresh id and no client state; response HTML contains the unlock button text and translated text, does not contain original text. `ShareView.tsx` logic (localStorage gate) unchanged from first pass. |
| 3 | `/m/[id]` initial response does not contain original text anywhere in markup/JSON/inline script | **Pass — P0 fixed.** Fetched real `/m/[id]` HTML for a fresh id: original text absent, translated text present, id itself present (expected, needed for client to call reveal) but id is now ciphertext — base64url-decoding it yields no JSON/plaintext (see §1). Directly contradicts the old Bug #1: the id no longer *is* the payload in a form that leaks `o`. |
| 4 | Unlock tap: distinct non-instant processing state (~1s), calls `/api/reveal/[id]`, cross-fade to original + "originally:" note, never before response is in hand | **Pass (carried forward)** — `ShareView.tsx` unchanged since first pass's live-timed verification (`Promise.all(fetch, 1000ms)` gating, `.trsl-processing` pulse, `.trsl-unlock-enter`/`.trsl-unlock-exit` classes all present in `globals.css`). Reveal endpoint itself re-verified directly: `/api/reveal/[id]` with a valid id returns `{original}` matching the real original text, 200. |
| 5 | Reload after unlock shows original already unlocked, no re-paywall, reveal endpoint re-called each load (never cached client-side in a way that would require storing it before the paywall) | **Pass — strengthened by the fix.** The first pass's caveat on this criterion ("same root cause as Bug #1 undermines the never-cached-before-paywall clause") is now closed: `UNLOCKED_IDS_KEY`/`SENT_IDS_KEY` (`client-flags.ts`) store only the id string, and the id is now ciphertext with no recoverable `o` (§1) — so storing it is no longer equivalent to storing the original before the paywall. `ShareView.tsx` (unchanged file, read directly) holds `original` only in a `useState`, never written to `localStorage`; the auto-reveal branch still calls `/api/reveal/[id]` fresh on every mount, confirmed re-callable and idempotent (called twice for the same id, both 200 with identical `original`). |
| 6 | Sender's own fresh link auto-reveals, no paywall | **Pass (logic carried forward)** — `SENT_IDS_KEY` set in `page.tsx` (main) at translate-success, unchanged file. Reveal endpoint confirmed to serve the correct original for any valid id regardless of caller, which is what the auto-reveal path depends on. |
| 7 | Tampered/forged ids 404 on both `/m/[id]` and `/api/reveal/[id]` | **Pass** — tested tampering at start, middle, and end of a real id, plus garbage strings and a 1-char id, on both routes: all 404, all clean JSON/notFound responses, no 500s. One artifact worth recording, not a bug (see note below). Also confirmed `/api/reveal/[id]` grants `original` to *any* caller holding a valid id, no localStorage/auth check — this matches FINAL.md's "Scope: out" (explicitly not hardening reveal beyond decrypt/auth this iteration), so it's a confirmation of intended behavior, not a finding. |
| 8 | Share button shows distinct copy-confirmation animation | **Pass (carried forward)** — `.trsl-copied-pulse` present in `globals.css`, file unchanged since first pass's live verification (which also documented the `navigator.share`-hangs-in-headless-Chrome environment artifact — not re-tested this round, no browser available). |
| 9 | No new backend/DB/payment SDK; only `/api/translate` + `/api/reveal/[id]` | **Pass** — `package.json` unchanged: `next`, `openai`, `react`, `react-dom` only, no `stripe`. `npm run build` output lists exactly `/api/translate` and `/api/reveal/[id]` as the only API routes. |
| 10 | v1 criteria still hold (guardrail, char limit, OG tags, noindex, anonymous usage) | **Pass** — re-tested live: DECLINE guardrail fires on a real threat ("I am going to kill you tonight...") → `{declined:true}`, 200. Empty input → 400. Malformed JSON body → 400. >1000 chars → 400. `noindex` and `og:title`/`og-image` present in `/m/[id]` HTML. `npm run build` compiles clean, 0 errors. |

**10/10 pass.**

### Tamper-test artifact (not a bug) — base64 padding-bit edge case
Flipping the *literal last character* of an id whose base64url length is
≡ 2 (mod 4) can occasionally leave the decoded byte array unchanged: RFC
4648 base64 without padding has up to 4 unused low bits in the final
character of that length class, and Node's `Buffer.from(..., "base64url")`
doesn't reject non-zero padding bits. Verified directly with a synthetic
buffer (250 random bytes → 334-char base64url, length%4==2): flipping the
last char left the decoded bytes byte-for-byte identical. When this
coincidence occurs, the "tampered" id decodes to the exact same ciphertext
as the original — there was nothing to tamper, the two strings collide to
one plaintext. Confirmed this is not an auth-bypass: re-ran the tamper-test
matrix (start/middle/end) fresh and got 404/404/404 on all three positions
for a fresh id; the earlier 200-at-last-char observation was this padding
collision, not a broken tag check, and is inherent to base64url encoding —
present in v1 too, not introduced or worsened by this fix, not exploitable
(attacker gains nothing: the "tampered" id is functionally the original
id). Not filed as a bug.

## 3. Old-format (pre-fix) ids fail gracefully

Reconstructed the exact pre-fix `share.ts` (`git show 72fd2e6~1`) HMAC
scheme with the real current `SHARE_SECRET`, generated an old-format
`<base64url-payload>.<sig>` id, and hit it against the current (fixed)
server:

- `/m/[old-format-id]` → **404** (not 500, not a crash)
- `/api/reveal/[old-format-id]` → **404**, clean `{"error":"Not found."}`
  JSON body

Mechanism: the `.` separator isn't valid base64url alphabet, Node's decoder
silently skips invalid characters rather than throwing, so
`Buffer.from(id, "base64url")` succeeds and produces some bytes; those get
sliced into iv/tag/ciphertext and `decipher.final()` throws on GCM
tag-verification failure; `decodeShareId`'s `try/catch` catches it and
returns `null`; both call sites turn `null` into a clean 404. **Confirmed
empirically, matches DISCUSSION-2's claim, no crash/500 path found.**

Also ran the shipped self-check: `npx tsx src/lib/share.selfcheck.ts` →
`share.ts self-check passed`.

## Bugs

None open. No P0/P1/P2 found this pass.

## Design-defect note status
The tension QA.md flagged (FINAL.md's "id itself" mechanism vs. criterion 3's
"no original in link" guarantee) is resolved by the fix: the id can still
*be* the payload (satisfying "the id itself" for reveal to work) because it's
now ciphertext, not plaintext-JSON — the two requirements are no longer
mutually exclusive once "the id" and "the payload" are decoupled by
encryption rather than by trying to keep `o` out of the id. No FINAL.md
revision needed beyond what's already there.

## Verdict

**Ship.** The P0 is fixed at the root (real AES-256-GCM encryption of the
whole payload, not encoding+signing), independently reproduced-as-fixed via
direct offline decode attempts, and all 10 FINAL.md acceptance criteria pass
against current main. Old-format ids degrade gracefully. Criteria 1/4/8's
exact animation pixels are worth a live spot-check next time a browser is
available, purely for housekeeping — the unchanged-file evidence is
sufficient to ship on now.
