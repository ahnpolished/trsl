# Backlog

Seed (from README.md, pre-v1):
- Core flow: husband writes raw message -> app "translates" to a sendable
  version -> shareable output (OG-ready link/image) for iMessage/WhatsApp/IG DM
- Wife pays $1 to reveal the original unfiltered message
- Mobile-first, fun/eye-catching, social-shareable

## Candidates
(reviewer appends here after each iteration's RETRO.md)

### From v1 retro (2026-08-30)
- **[Top priority]** Close QA's blocked criteria 8 & 10: real Vercel
  deploy with live `ANTHROPIC_API_KEY` + `SHARE_SECRET`, verify real OG
  unfurl (Facebook Sharing Debugger / iMessage) and full flow on a real
  device. PRIORITY.md treats an unverified share link as a failed feature
  for this phase — this outranks new scope. (KV creds no longer apply —
  share IDs are now stateless HMAC-signed, not KV-backed; see resolved
  items below.)
- Add a request timeout (`AbortController`) on the Anthropic call in
  `src/lib/translate.ts` — currently inherits the SDK's 10-minute
  default (QA P2, carried forward).
- Rate limiting on `/api/translate` — it's an anonymous, unauthenticated
  endpoint that spends real API money per call; explicitly deferred in
  v1 as "engineer's call if trivial," now worth a real decision.
- Verify the DECLINE guardrail against a live model and real adversarial
  inputs once a key exists — QA could only test the app's handling of a
  literal `DECLINE` string via a mock; whether Haiku reliably emits that
  exact token (vs. refusing in its own words, e.g. "I can't help with
  that") for real threats/coercion/self-harm input is untested. A
  refusal that doesn't start with `DECLINE` currently falls through to
  the normal-translation branch and gets a share link. Consider treating
  any response that doesn't look like a clean translation (e.g. starts
  with model refusal language generally) as fail-closed, not just the
  literal token.
- Retention/deletion path for permanent, public, unauthenticated
  personal messages — v1 explicitly deferred this as "engineer/ops
  call," worth a real answer once real users exist.
- The deferred $1 pay-to-reveal-original paywall (phase 2 per
  PRIORITY.md) — build once the core loop above is verified end-to-end
  on a real deploy.

### From v1 correction cycle retro (2026-08-30, state/versions/v1/RETRO-2.md)
- Harden the dev-secret fallback in `app-trsl/src/lib/share.ts`: it only
  refuses `DEV_SECRET_FALLBACK` when `NODE_ENV === "production"`, which
  holds on Vercel/`next start` but degrades silently (no crash, no log) to
  a git-visible hardcoded secret on any deploy target that doesn't
  reliably set that var (self-host, bare Docker, another PaaS). Gate on
  `SHARE_SECRET` being explicitly set instead of inferring safety from
  `NODE_ENV`.
- Resolved this cycle, not carried forward:
  - Real branded `og-image.png` (was placeholder) — done, `6e832fb`.
  - Share-ID forgery via hand-crafted `/m/<id>` bypassing the DECLINE
    guardrail — fixed with HMAC-SHA256 signing (`8ad72af`), independently
    re-verified by critic (DISCUSSION-2.md) and QA (QA-2.md), verdict
    ship. Superseded the earlier "fail fast on missing KV creds" backlog
    item — KV is gone, replaced by the stateless signed scheme.

## Shipped
(release-manager appends here after each version ships)
- v1 (2026-08-30): core translate -> DECLINE-guarded -> shareable UUID link flow, `noindex`+OG share pages. See `state/versions/v1/RELEASE.md`.
- v1 correction (2026-08-30): dropped KV dependency for stateless
  HMAC-signed share IDs, fixed the resulting guardrail-bypass
  vulnerability, shipped a real OG image. See
  `state/versions/v1/DISCUSSION-2.md`, `QA-2.md`, `RETRO-2.md`.
