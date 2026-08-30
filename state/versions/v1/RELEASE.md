# v1 Release

**Version:** v1 (app version 1.0.0)
**Date:** 2026-08-30
**Status:** Shipped (QA verdict: ship, no open P0/P1)

## Summary

v1 ships the core trsl flow as a real Next.js app: a user types a raw
message into a single-screen textarea (1000-char cap, enforced client and
server side), the message is sent to Claude for translation into a softer,
sendable version, with a `DECLINE` guardrail in the system prompt that
refuses to translate threats, coercion, or self-harm content (no share link
is created for declined content). A successful translation issues a
permanent UUID v4-keyed shareable link at `/m/<id>`, rendered fresh with no
login or paywall, carrying `noindex`/`nofollow` and rich Open Graph tags
(generic title/description, static image — never the raw message text) so
it unfurls cleanly on iMessage/social without exposing the message to
search engines. Storage is a small interface with a Vercel KV / Upstash
Redis backend for production and a file-based fallback for local dev.

QA's one open P1 (the `DECLINE` guardrail failing open on non-exact model
output, e.g. trailing punctuation) was fixed and re-verified live this
pass; full regression across all 10 acceptance criteria found no
regressions. Two criteria (real-unfurl testing, full flow on a live deploy)
remain blocked only on a human supplying deploy secrets, not on code —
tracked below and in `app-trsl/README.md`.
