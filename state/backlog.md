# Backlog

Seed (from README.md, pre-v1):
- Core flow: husband writes raw message -> app "translates" to a sendable
  version -> shareable output (OG-ready link/image) for iMessage/WhatsApp/IG DM
- Wife pays $1 to reveal the original unfiltered message
- Mobile-first, fun/eye-catching, social-shareable

## Candidates
(reviewer appends here after each iteration's RETRO.md)

### From v1 retro (2026-08-30)
- Resolved by v2 (deploy live at https://trsl.vercel.app, tag v2):
  - ~~Close QA's blocked criteria 8 & 10: real Vercel deploy with live
    key + `SHARE_SECRET`, verify real OG unfurl and full flow on a real
    device.~~ Live deploy confirmed; QA-2.md re-ran the full v1 criteria
    list (guardrail, char limit, OG tags, noindex) against it, all pass.
  - ~~Verify the DECLINE guardrail against a live model and real
    adversarial inputs.~~ QA-2.md #10: real threat input
    ("I am going to kill you tonight...") against the live model
    correctly returns `{declined:true}`. Note: only the literal-token
    exact-match failure mode from v1's P1 was retested, not the broader
    "does a refusal-shaped-but-not-DECLINE response fail closed" question
    — narrow re-open below if it ever matters.
  - ~~The deferred $1 pay-to-reveal-original paywall.~~ Shipped in v2 as
    a mock (no real payment processor) — real Stripe integration is a
    separate, still-open item below.
- Rate limiting on `/api/translate` — still open, untouched in v2. It's an
  anonymous, unauthenticated endpoint that spends real API money per call;
  explicitly deferred in v1 as "engineer's call if trivial," now shipped
  live with real traffic possible, worth a real decision.
- Retention/deletion path for permanent, public, unauthenticated personal
  messages — still open, untouched in v2. v1 explicitly deferred this as
  "engineer/ops call," worth a real answer now that real links can be
  generated and shared on a live deploy.
- Narrower guardrail question, split from the item above: whether a model
  refusal that doesn't start with the literal `DECLINE` token (e.g. the
  model refuses in its own words) currently falls through to the normal-
  translation branch and gets a share link. Untested by either v1 or v2 QA
  passes — both used a threat input specifically chosen to elicit the
  literal token. Worth a real adversarial pass once traffic makes it
  likely, not urgent pre-emptively.

### From v1 correction cycle retro (2026-08-30, state/versions/v1/RETRO-2.md)
- Resolved this cycle, not carried forward:
  - Request timeout on the Anthropic call in `app-trsl/src/lib/translate.ts`
    — `Anthropic` client now gets a 20s `timeout`, so a hung upstream call
    fails clean (existing try/catch turns it into the route's 502 JSON
    error) instead of holding a serverless function open indefinitely.
  - Dev-secret fallback in `app-trsl/src/lib/share.ts` hardened — no more
    hardcoded fallback string. When `SHARE_SECRET` is unset, a random
    secret is generated once at process startup (fine for dev/single
    instance); `NODE_ENV=production` with `SHARE_SECRET` still unset still
    throws loudly. No known fallback value ships in git anymore.
  - Real branded `og-image.png` (was placeholder) — done, `6e832fb`.
  - Share-ID forgery via hand-crafted `/m/<id>` bypassing the DECLINE
    guardrail — fixed with HMAC-SHA256 signing (`8ad72af`), independently
    re-verified by critic (DISCUSSION-2.md) and QA (QA-2.md), verdict
    ship. Superseded the earlier "fail fast on missing KV creds" backlog
    item — KV is gone, replaced by the stateless signed scheme.

### From v2 retro (2026-08-30, state/versions/v2/RETRO.md)
- **Real Stripe integration** for the $1 unlock — v2 shipped a mock
  (client-side timed state transition, no charge). PRIORITY.md explicitly
  deferred this to a later phase; now the natural next candidate once the
  mock has proven the unlock UX is worth paying for.
- **`SHARE_SECRET` has no entropy floor** — flagged by critic in
  DISCUSSION-2.md as a pre-existing gap (present since v1's HMAC scheme,
  unchanged by v2's AES fix): `getSecret()` accepts any string in
  production, no length/randomness check. Fix is a length/entropy check in
  `getSecret()` on production boot, not a KDF change. Not blocking either
  release so far; worth closing before it's rediscovered as an incident.
- `/api/reveal/[id]` has no authorization beyond decrypt/auth verification
  (any caller with a valid id can fetch `original`, sender or not) — this
  is FINAL.md's explicit, deliberate v2 scope ("Scope: out"), not a bug,
  but worth a real decision once there's a reason a receiver's device
  shouldn't be able to hand the link to someone else and let them unlock it
  too.
- No format/version byte in the AES-GCM blob (`iv||tag||ciphertext`, no
  discriminator) — DISCUSSION-2.md called this fine for now; cheap to add
  if the id encoding ever changes again, not worth doing reactively today.

### From v3 retro (2026-08-30)
- **Rate limiting / cost control on `/api/translate`** — already open since
  v1, but v3's optional `context` field increases per-call token spend and
  gives an unauthenticated endpoint a longer user-controlled prompt. Worth
  treating as a higher-priority backlog item than before.
- **Lightweight eval harness for context/tone translation quality** — v3
  measured output quality qualitatively on a handful of examples, which is
  the right call at this scale. Once there's enough real usage or prompt
  iteration velocity, a small golden-set regression (even a dozen before/
  after pairs) will prevent silent regressions in the output bar.
- **Context 200-char cap usage signal** — the cap covered v3's user-story
  examples and was the right default. If real senders consistently hit the
  ceiling, that's the signal to widen it; don't widen preemptively.

## Shipped
(release-manager appends here after each version ships)
- v1 (2026-08-30): core translate -> DECLINE-guarded -> shareable UUID link flow, `noindex`+OG share pages. See `state/versions/v1/RELEASE.md`.
- v1 correction (2026-08-30): dropped KV dependency for stateless
  HMAC-signed share IDs, fixed the resulting guardrail-bypass
  vulnerability, shipped a real OG image. See
  `state/versions/v1/DISCUSSION-2.md`, `QA-2.md`, `RETRO-2.md`.
- v2 (2026-08-30): mock $1 paywall with server-side AES-256-GCM-encrypted
  reveal mechanism, three new animation moments (translate reveal/unlock
  reveal/share confirmation); mid-cycle P0 (id recoverable via base64
  decode) caught by QA and fixed via encryption before shipping. See
  `state/versions/v2/RELEASE.md`.
- v3 (2026-08-30): optional tone chips + context input on the composer,
  fed into a rewritten `translate()` prompt; `context` is appended to the
  user-role message so the DECLINE guardrail covers it for free, and the
  200-char cap is enforced client- and server-side. Sender-side only —
  nothing leaks to `/m/[id]`. See `state/versions/v3/RELEASE.md`.
