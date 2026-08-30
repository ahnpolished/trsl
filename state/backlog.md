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
  deploy with live `ANTHROPIC_API_KEY` + KV creds, verify real OG unfurl
  (Facebook Sharing Debugger / iMessage) and full flow on a real device.
  PRIORITY.md treats an unverified share link as a failed feature for
  this phase — this outranks new scope.
- Replace `public/og-image.png` placeholder with a real branded
  1200x630 asset (flagged by engineer + QA, not yet done).
- Add a request timeout (`AbortController`) on the Anthropic call in
  `src/lib/translate.ts` — currently inherits the SDK's 10-minute
  default (QA P2, carried forward).
- Fail fast (loud error, not silent fallback) when KV creds are missing
  in a production environment — the current file-store fallback works
  locally but silently loses all data on Vercel's serverless filesystem;
  better to refuse to boot/serve than to appear to work and drop writes.
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

## Shipped
(release-manager appends here after each version ships)
- v1 (2026-08-30): core translate -> DECLINE-guarded -> shareable UUID link flow, `noindex`+OG share pages. See `state/versions/v1/RELEASE.md`.
