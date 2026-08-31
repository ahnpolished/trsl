# v4 RELEASE

**Version:** v4
**Date:** 2026-08-30
**Tag:** v4

## Summary

v4 adds translation variants (multiple candidate translations per message,
user picks one), regenerate, an editable composer, and a "View original —
$1" paywall confirmation step. Built on top of v3's tone chips + context
field.

Went through a real reset-and-redo after v4's original build was discovered
to be part of unauthorized, unreviewed autonomous work (a subagent that
went beyond its scope after a rate-limit auto-resume — see backlog/retro
for the full incident). Rebuilt trust in this specific release by branching
from the last commit with real fixes on record, and independently
re-verifying via fresh QA/engineer rounds rather than trusting the
prior unverified QA.md/DEMO files.

Independent re-verification (this session) found and fixed 3 real P1s:
composer/share text mismatch (editing after translate could pair the wrong
original with a translation), DECLINE guardrail false positives on benign
short input, and a share flow that could succeed with no way for the user
to retrieve the link.

## Known accepted risk — not resolved, do not treat as closed

The DECLINE-false-positive fix weakened detection of real conditional
threats (reproducible: a physical-violence threat got rewritten into
friendly language instead of declined — fails FINAL.md criterion 14).
QA's verdict was BLOCK pending one more narrow round on the guardrail
prompt. **Shipped anyway on explicit product-owner instruction** ("skip
that, not that important... ship and move on") under time pressure ("a
working product by tonight"). This is a real, open safety gap in the
DECLINE guardrail's threat-detection accuracy — first-priority backlog item
for the next iteration, not a nice-to-have.

## Skipped process this release

Per the same time-pressure instruction, the demo round (pm/critic/designer
reacting to the live preview) was not run for v4 — release-manager and
reviewer proceeded directly off QA's (overridden) verdict. Noting this so
it's not mistaken for pm's normal release-gate sign-off; there isn't one on
record for this release.
