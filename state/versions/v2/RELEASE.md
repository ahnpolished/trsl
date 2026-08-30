# v2 RELEASE

**Version:** v2
**Date:** 2026-08-30

## Summary

v2 ships the mock $1 paywall: the wife's link now shows a locked, translated
preview with an "Unlock the original — $1" button; tapping it reveals the
real message via a server-side `/api/reveal/[id]` endpoint, with three new
animation moments (translate-result reveal, unlock-reveal cross-fade, and
share copy-confirmation pulse). Mid-cycle, QA's first pass (QA.md) caught a
P0: the share id was only base64+HMAC-signed, so the original message could
be recovered offline by anyone with the link via a plain base64 decode — the
paywall was cosmetic. The engineer fixed this at the root by switching the
share id payload to real AES-256-GCM encryption (commit `72fd2e6`) instead of
encode+sign, so no plaintext or recoverable original travels in the link.
QA-2.md independently re-verified the fix (offline decode attempts fail,
wrong-key decrypts fail GCM auth, old-format ids degrade to clean 404s) and
re-checked all 10 FINAL.md acceptance criteria against current `main`: 10/10
pass, no open P0/P1/P2. Verdict: ship.

## Reference

- `state/versions/v2/QA-2.md` — final verification, ship verdict
- `state/versions/v2/DISCUSSION-2.md` — P0 fix discussion
- Fix commit: `72fd2e6`
