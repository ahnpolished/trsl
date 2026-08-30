# v3 RELEASE

**Version:** v3
**Date:** 2026-08-30
**Tag:** v3

## Summary

v3 ships optional sender-side context for the translate call: a row of
one-tap tone chips (Gentle, Direct but kind, Playful, Just being honest,
Setting a boundary) and an optional 200-character context input, both
consumed by a rewritten `translate()` prompt. The goal is to close the
"out of context / doesn't sound like what I meant" gap that undermines the
paywall's value — if the softened message doesn't read as a real rendering
of the sender's intent, there's nothing worth unlocking.

Critic identified two blockers during design:
1. **Abuse surface:** putting free-text `context` in the system prompt
   would let it bypass the existing DECLINE guardrail and create an
   injection vector. Fixed by appending `context` to the **user** message
   alongside `raw`, so the guardrail sentence already covers both for free.
2. **Server-side cap:** the 200-char limit was described as client-only.
   Fixed by mirroring the existing `MAX_CHARS` check in `route.ts`:
   oversized `context` is rejected with 400 before it reaches `translate()`.

QA independently live-verified all 10 FINAL.md acceptance criteria against
the built app (real OpenAI calls, browser-use for UI, direct `fetch()`
POSTs to bypass client validation): 10/10 pass, no open P0/P1/P2.

## Demo round

Demo ran in two rounds because the first preview URL was behind Vercel
Deployment Protection and redirected to a login page in a fresh browser
session. Round 1 (PM) held on that access issue; product-designer and
critic evaluated the production alias instead and shipped. Round 2 re-ran
the PM pass against the public production alias `https://trsl.vercel.app`
and shipped. Final demo verdicts:

- PM Round 2: **ship**
- product-designer Round 1: **ship**
- critic Round 1: **ship**

No unresolved holds. The only advisory note was a pre-existing subtitle
color (`#999`) that does not match BRAND.md's secondary `#888`; it
predates v3 and was left out of scope.

## Process note

Production was deployed before the demo round completed. The deployment
URL matched the commit under review (`b398e06`), so no code changed
between the premature deploy and the final demo verdicts. Going forward,
the loop will deploy previews only until PM demos `ship`.

## Production

https://trsl.vercel.app

## Reference

- `state/versions/v3/DEMO.md` — full demo-round history
- `state/versions/v3/QA.md` — final verification, ship verdict
- `state/versions/v3/DISCUSSION.md` — critic blockers and resolutions
- `state/versions/v3/CHANGELOG.md` — implementation notes and criterion-by-criterion verification
