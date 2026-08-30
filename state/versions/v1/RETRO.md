# v1 Retro

## What worked
- Critic caught two real pre-ship risks (guardrail-free abuse laundering,
  permanent unauthenticated indexable links) and both fixes landed as
  cheap, additive FINAL.md requirements — no scope creep, no missed
  iteration.
- QA didn't stop at "no live key = blocked" — it stubbed the Anthropic API
  to exercise real request/response/storage/UI-state logic end to end, and
  re-ran the *entire* criteria list (not just the fixed criterion) on the
  P1 re-check, catching regressions if there had been any.
- Engineer's fix for the P1 was scoped correctly: one guard where all
  callers of the DECLINE check route through (there's only one), not a
  patch bolted onto a symptom.

## What didn't: the P1 (guardrail exact-match failed open on trailing punctuation)

**Symptom:** `translate.ts` checked `text.trim() === "DECLINE"`. A model
response of `"DECLINE."` (trailing punctuation) failed the equality check,
fell through to the "normal translation" branch, and got a share link —
the exact failure mode the guardrail exists to prevent.

**Root cause, one level back:** FINAL.md specified a *mechanism*
("respond with exactly the token `DECLINE`," checked via string match)
without stating the *invariant* the mechanism was supposed to guarantee —
that any output the app can't confidently classify as a normal
translation must be treated as a decline (fail closed on a safety path),
not the reverse. Given only a mechanism and no stated invariant, an exact
match is a perfectly reasonable reading of "exactly the token" — it
satisfies the letter of the spec while inverting the property the spec
was written to protect. The gap didn't originate with the engineer's
implementation; it originated in DISCUSSION.md's fix ("a single prompt
instruction, not a moderation pipeline," accepted correctly to keep this
additive) being hardened into FINAL.md's locked mechanism without anyone
in the loop asking "what happens when the model's output doesn't match
this exactly?" That question is the missing step, not a missing test.

**Cost:** one full engineer-fix + QA-re-verify round trip that a single
"what if the match is inexact" pass at FINAL.md time would have avoided.

**Not root cause (symptoms, don't chase these):** "engineer used the
wrong comparison operator," "QA should have thought of trailing
punctuation earlier" — both true but downstream of the spec gap above.

## Should FINAL.md have prevented this?
Yes — see root cause above. This is exactly the persona's directive to
trace a spec-shaped bug to the spec, not the code. QA's own QA.md agrees
now that the fix is in ("spec and implementation are now aligned"), but
that agreement was reached after a round trip, not before one.

## Watch items (not process changes — see below for why)

1. **FINAL.md was amended in place, not appended-to.** The pre-fix wording
   ("exactly the token `DECLINE`" with no tolerance language) is only
   recoverable from CHANGELOG.md's description of the diff — git history
   for `FINAL.md` is a single squashed commit that already contains the
   post-fix text, so there's no commit-level record of what the spec said
   when engineering built against it. That's fine for shipping (QA
   re-verified against the current file) but it erases the audit trail a
   future retro would need to tell "spec was wrong, code drifted" apart
   from "spec was right, code drifted" on some *other* bug. Watch for this
   again before making it a rule — one iteration isn't a pattern, and the
   fix (append dated amendments instead of overwriting) is easy to add
   later if it recurs.

2. **A "ship" verdict shipped against PRIORITY.md's own bar.** PRIORITY.md
   states explicitly that "a link that isn't OG-ready" is a *failed
   feature* for this phase, not a partial win. QA's criteria 8 (real OG
   unfurl) and 10 (full flow on a real deploy) are both BLOCKED, not
   PASS — blocked on sandbox limits (no deploy target, no live API key),
   not on code defects, which is why QA and RELEASE.md correctly didn't
   treat them as P0/P1 bugs. But nothing in the loop reconciled "QA
   verdict: ship" with "the phase's own definition of done requires this
   verified." Not relitigating v1's release — flagging it so the next
   iteration's backlog ordering reflects it (see below) and so a future
   retro checks whether this recurs before it becomes a process change.

## Process changes
None. This is v1 — no prior RETRO.md exists, so the "2+ recurring
iterations" trigger for editing AGENT.md/LOOP.md doesn't fire. Both items
above are logged as watch items for the next retro to check against, not
acted on now.
