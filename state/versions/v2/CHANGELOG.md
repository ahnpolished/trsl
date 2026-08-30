# v2 CHANGELOG

Shipped: mock $1 paywall (server-side reveal endpoint, no real payment provider) + three-moment motion polish. Commit `ea6667d`.

## Acceptance criteria (FINAL.md)

1. **Result text animates in on translate** — `.trsl-result-enter` (blur→sharp fade-up) on `/`. Verified visually via CSS/class wiring; build compiles clean.
2. **Non-sender device sees the locked/paywall state** — `ShareView.tsx` checks `SENT_IDS_KEY`/`UNLOCKED_IDS_KEY` via localStorage; a fresh client (no flags set) renders the locked view. Verified via `node fetch` (no browser localStorage = receiver path) hitting `/m/[id]` and `/api/reveal/[id]` directly.
3. **Original text absent from `/m/[id]`'s initial server response** — confirmed live: fetched a real share page's HTML, grepped for the original message text, not present. Only `translated` crosses the server→client boundary in `page.tsx`; `original` is fetched separately via `/api/reveal/[id]`.
4. **Distinct processing state on unlock tap** — `phase: "processing"` renders "Unlocking…" with `.trsl-processing` pulse animation; the ~1s beat is raced against the real `fetch` via `Promise.all` so a slow network never shows a premature swap.
5. **Unlock persists per-device across reloads** — `UNLOCKED_IDS_KEY` set on successful unlock; `ShareView` auto-reveals on mount if the id is in that set.
6. **Sender's own link auto-reveals, no paywall shown** — `SENT_IDS_KEY` set at translate-success time (`page.tsx`); `ShareView` checks it on mount and skips straight to `revealed`.
7. **Tampered/forged ids 404 on both routes** — verified live: a forged id (valid-looking payload, garbage signature) returns 404 from both `/m/[id]` and `/api/reveal/[id]`. Same HMAC verification (`decodeShareId`) backs both.
8. **Share button shows distinct copy-confirmation animation** — `.trsl-copied-pulse` (scale-pulse, 150ms) applied on the "Copied!" state.
9. **No new backend/database/payment SDK** — confirmed: no new dependencies added beyond what v1 already had (`openai`). Paywall is a fake `setTimeout` beat + a real-but-payment-free reveal endpoint.
10. **v1 criteria still hold** — guardrail, char limit, OG tags, noindex, timeout, signed ids: unchanged, not touched by this diff except `share.ts`'s payload shape (`{t}` → `{t, o}`), which is additive and still HMAC-verified the same way.

## Notes for QA

- Live-verified end to end against a real OpenAI call (not mocked) during engineering: translate → share page (original absent from HTML) → reveal → real original text returned → forged-id 404 on both routes.
- `localStorage` sender/unlock flags are explicitly a UI-routing heuristic, not auth — `/api/reveal/[id]` grants `original` to anyone holding a valid signed id, same trust level v1 already gave `translated`. This is a deliberate, documented FINAL.md decision (see FINAL.md "Resolved" #1), not a gap QA should treat as a new finding unless it contradicts the spec.

## P0 fix (post-ship)

QA found that criterion 3/10 above ("original absent from initial response",
"still HMAC-verified") missed the actual leak: the share id **is** the
`/m/[id]` URL path segment, so `o` being merely base64url-encoded meant it
was plaintext-readable straight from the address bar, no page load or RSC
boundary required — defeating the paywall premise regardless of what
`page.tsx` did or didn't forward to the client.

Root-cause fix in `share.ts`: the whole `{t, o}` JSON payload — not just `o`
— is now AES-256-GCM encrypted as one blob with a key derived from
`SHARE_SECRET` (`sha256(SHARE_SECRET)`, 32 bytes); the id is that ciphertext,
base64url-encoded. `t` isn't secret (still meant to be publicly readable
once the page renders), but it's covered by the same auth tag as `o` so it
can't be forged either — an earlier version of this fix encrypted only `o`
and left `t` as unauthenticated plaintext JSON, which meant an attacker
could take one valid id and rewrite `t` to arbitrary text with the real
`o` ciphertext still attached, passing GCM auth and rendering under the
trsl brand; caught before commit and fixed by encrypting the full payload.
The old separate HMAC signature is removed as redundant, not weakened:
GCM's own auth tag now does the tamper/forgery check (bad tag → decrypt
fails → `decodeShareId` returns `null` → 404, same behavior as before).
`decodeShareId`'s return shape (`{t, o}`) and both call sites (`page.tsx`,
`/api/reveal/[id]`) are unchanged.

Re-verified: took a real generated id, base64url+JSON-decoded it with no
server secret — the whole thing is opaque ciphertext bytes, no `t` or `o`
text recoverable. Only `decodeShareId` with the correct `SHARE_SECRET`-
derived key recovers the real payload. Tampering with the id at any
position (start, middle, end) still 404s — not just the tail, which a
naive first-pass check missed. Self-check: `app-trsl/src/lib/share.selfcheck.ts`
(`npx tsx src/lib/share.selfcheck.ts`).

Deliberate break: any already-shared v2 links (old `payload.sig` format)
stop resolving — `JSON.parse` on the old plaintext-payload half now fails
against the new ciphertext decode path, so they 404 gracefully instead of
leaking. Acceptable since v2 shipped same-session as this fix.
