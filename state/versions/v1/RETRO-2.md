# v1 Retro — Correction Cycle (loop-bypass security fix)

Covers commits `a809fd8` (the bypass) through `6e832fb` (OG image + doc
reconciliation), i.e. everything that happened to v1 after RETRO.md was
already written and v1 was already tagged. A fresh file, not an append to
RETRO.md, because RETRO.md closed out the original cycle with a verdict and
a "process changes: none" line — this cycle has its own timeline, its own
root cause, and its own verdict, and squashing it into the first file would
blur which cycle a future reader is looking at. (This also follows watch
item #1 from RETRO.md: prefer a new dated record over silently rewriting an
old one.)

## What happened, in order

1. `a809fd8` — "deploy prep," requested directly by the orchestrator/user,
   outside the loop: dropped the Vercel KV dependency, replaced it with a
   stateless `/m/<id>` where `id` is base64url of `{t: text}` — the id
   *is* the content, unsigned. No DISCUSSION, no QA. Landed on main.
2. This created a real vulnerability: `/m/<id>` renders whatever text is in
   the payload, and the DECLINE guardrail only runs inside
   `/api/translate`. Anyone who can construct a base64url string can get
   arbitrary text rendered on a branded trsl page — the exact bypass the
   guardrail exists to prevent, reachable by skipping the route that
   contains the guardrail entirely.
3. Caught (not by the loop — the vulnerability shipped and sat on main
   until someone noticed the shape of the change was security-relevant).
4. Fixed: `8ad72af`/`f626aae`, HMAC-SHA256 signing of the share payload,
   `timingSafeEqual` verification, fail-closed to 404 on any bad/missing
   signature.
5. Retroactively reviewed: `DISCUSSION-2.md` (critic, verdict: sufficient)
   and `QA-2.md` (qa, verdict: ship) — both run *after* the fix was
   already on main, exercising the live app rather than reasoning about a
   diff pre-merge.
6. `6e832fb` — separately, replaced the placeholder OG image with a real
   branded asset and corrected stale KV references left behind in
   `QA.md`/`RELEASE.md` by step 1.

## Root cause: why did a security-relevant change reach main without critic/QA?

Not "the engineer made a bad call" — the HMAC fix itself is clean, and
DISCUSSION-2.md independently confirms it closes the hole. The gap is
upstream of any individual decision:

**The loop has no mechanism for a change requested outside step 4
(engineer) to re-enter the loop at step 2 (critic) before merging.**
`LOOP.md` defines a strict sequence — pm → designer → critic → designer →
engineer → qa → release → reviewer — but that sequence only governs
*iterations*. Nothing in `LOOP.md` or any persona's `AGENT.md` says what
happens when a request arrives directly, mid-cycle, from the
orchestrator/user, addressed straight to the engineer. There's no rule
that routes such a request through critic/QA first, and no rule that
*blocks* the engineer from just doing it. So "skip the loop" wasn't a
violation of a stated rule — it was the default behavior in the absence of
one.

Compounding that: nothing about the *framing* of the request ("deploy
prep," "drop a dependency") signals "security decision" on its face.
DISCUSSION-2.md already named this precisely: "removing a database
dependency" reads as infra housekeeping; "changing what makes a share ID
unforgeable" is a security decision wearing an infra-change costume. Even
if there *were* a rule routing direct requests through critic first, a
rule that only fires on requests self-labeled "security" would have missed
this one too — the trigger has to be about what the diff touches
(anything that decides whether unauthenticated input becomes rendered
public output), not about how the request was phrased.

**One further gap, smaller but real:** the fix for the bypass also shipped
directly to main before its own DISCUSSION/QA pass. DISCUSSION-2.md and
QA-2.md are both real, substantive, independent re-verifications — not
rubber stamps — but they ran after the fix was already live. The loop got
lucky that the fix was correct; nothing in the process guaranteed it would
be reviewed before exposure, only that it would eventually be reviewed
after.

## Is this worth a process change now, or a watch item?

**Watch item, not a process change.** This is the first occurrence of
"direct-to-engineer request bypasses critic/QA on a security-relevant
path." `agents/reviewer/AGENT.md`'s own bar is 2+ occurrences across
RETRO.md files before editing a persona or `LOOP.md` — DISCUSSION-2.md
already flagged this exact pattern and explicitly declined to promote it
to a rule for the same reason ("this is the first instance... named now so
it's checked next time, not rediscovered"). I checked prior RETRO.md (v1
original) for a matching pattern and found none — the v1 P1 was a
spec-precision gap inside the normal loop, not a loop-bypass. So this is
1 of 1, not 2 of 2, and I'm not editing `loop/LOOP.md` or any
`agents/*/AGENT.md` this cycle.

If a second direct-to-engineer, security-relevant bypass shows up in a
future RETRO(-N).md, the fix to write at that point is narrow and
mechanical, not a rewrite of the loop: add a line to `LOOP.md` stating
that any out-of-band request touching auth, signing, guardrail
enforcement, or what unauthenticated input can cause to render/execute
must route through critic (step 2 shape) before merge, regardless of who
requested it or how it's labeled. Naming it here so it doesn't need
rediscovering.

## What worked

- The vulnerability was caught before real damage (no live deploy yet,
  no real users) and the fix that landed was correct on the first try —
  confirmed independently by both critic and QA re-running the actual
  exploit against the live app, not just re-reading each other's notes.
- QA-2.md in particular re-ran the *entire* FINAL.md acceptance list, not
  just the security fix, catching that criterion 9's spec text had
  already been updated to match the new mechanism and confirming no
  regressions elsewhere — same discipline the original QA pass showed on
  the P1 re-check in v1.
- The OG-image and stale-doc cleanup (`6e832fb`) was swept in without
  inflating the security review — QA-2.md scoped it as its own numbered
  section rather than conflating "is the exploit closed" with "is the
  image real."

## What didn't

- The bypass happened at all — root-caused above.
- The fix for the bypass *also* bypassed the loop, compounding the
  original gap rather than being caught by it. Not blaming the engineer
  who wrote the HMAC fix (asked to be fast under a live vulnerability is
  a reasonable instinct) — but it's evidence the gap isn't "this one
  request slipped through," it's "there is currently no seam in the
  process that would have stopped either of these two changes."

## Residual items carried forward (not closed by this cycle)

Both already named by DISCUSSION-2.md/QA-2.md; carrying into backlog.md
rather than re-litigating here:
- Dev-secret fallback in `app-trsl/src/lib/share.ts` degrades silently
  (not loudly) outside an environment that force-sets
  `NODE_ENV=production`. Safe on Vercel/`next start` today; a real risk on
  any other deploy target.
- Secret rotation has no recovery path for already-issued links (inherent
  to the stateless design, an ops-docs gap, not a code defect).

## Process changes

None. Logged as a watch item (see above), consistent with
`agents/reviewer/AGENT.md`'s 2+-occurrence bar for editing
`agents/*/AGENT.md` or `loop/LOOP.md`. Re-check this file against future
RETRO(-N).md entries before the next occurrence, if any.
