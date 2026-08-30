# v2 Retro

## What worked
- Critic's round-1 read on the paywall was correct and sharp: "a picture of
  a paywall" named the real problem (original recoverable without paying)
  and the T&S angle (unfiltered text traveling in a forwardable link) in
  the same objection, not two separate nitpicks.
- The intermediate `t`-forgery hole in the engineer's first encryption draft
  (encrypt only `o`, leave `t` as unauthenticated plaintext — swap-t attack)
  was self-caught before commit, per CHANGELOG.md's P0 fix note. That's the
  loop working as intended even outside a formal stage: engineer noticed the
  gap in their own draft and closed it before anyone downstream had to.
- QA's first pass (QA.md) didn't stop at "criterion 3 fails" — it diagnosed
  *why* in one paragraph (the id is the URL path segment, so anything short
  of encryption is address-bar-readable) and correctly filed it as a design
  defect, not just an engineering miss, per its own AGENT.md instruction to
  attribute correctly. That distinction is what let engineer fix it at the
  right layer (encryption of the whole payload) instead of patching around
  `page.tsx`'s props.
- QA-2 and DISCUSSION-2 both re-verified the fix independently (offline
  decode attempts, wrong-key GCM failures, nonce/IV correctness, old-format
  graceful 404s) rather than taking the commit message's word for it. The
  crypto-specific retroactive critic pass (DISCUSSION-2.md) closing the loop
  on a fix that shipped post-block, pre-merge, is the standing watch-item
  mechanism from v1 RETRO-2.md working correctly this time — the fix got a
  critic pass before ship, not after.

## What didn't: the P0 (share id itself carried the original, unencrypted)

**Symptom:** DESIGN.md put `original` (base64, unencrypted) directly in the
public share URL. Critic's round 1 caught this (DISCUSSION.md objection 1,
verdict: revise) and prescribed the fix: move `original` off the id, add a
server-side `/api/reveal/[id]` endpoint, keep `t` in the rendered page. The
designer's FINAL.md implemented exactly that fix. It didn't work — QA's
first pass (Bug #1) found the original was still recoverable with zero
server involvement: one `atob()` of a substring already present in the raw
HTML, no reveal call, no devtools, no unlock tap.

**Root cause, one level back:** the fix critic prescribed and the designer
adopted addressed *what the server renders into the page* (`translated`
only, not `original`) but never addressed *what the id itself contains*.
The id has to reach the client either way — it's the URL path segment, and
the client needs it to call `/api/reveal/[id]`. As long as the id was
`base64url(JSON) + HMAC-signature` (encoding + tamper-detection, not
confidentiality), moving `original` out of the page's rendered JSON changed
*where in the response* the leak was visible but not *whether* it existed —
the id sitting in the URL bar and in the RSC flight script was always
sufficient to recover it, with or without the reveal endpoint existing.
Both critic and designer treated "server-side" and "not sent to the client"
as synonyms. They aren't, once the mechanism requires handing the client an
opaque-looking token that is, in fact, the payload. Nobody in round 1 asked
the one question that would have caught it: *given that the id must reach
the browser to do its job, can the id itself be decoded into the protected
content without hitting the server at all?* That question has a mechanical
yes/no answer (try `Buffer.from(id, 'base64url')` and see what comes out) —
it wasn't a judgment call anyone got wrong, it's a check nobody ran.

**Cost:** one full engineer-fix + QA-2 re-verification round trip
(commit `72fd2e6` + DISCUSSION-2.md + QA-2.md) that a single "can this id be
decoded with zero server involvement" check at DISCUSSION.md time would have
prevented — the same shape of cost v1's DECLINE-guardrail P1 paid for a
missing invariant check, and the same shape v1's KV-removal bypass paid for
a missing loop-entry check. Cheap to ask up front, expensive once it's
shipped-and-caught downstream instead.

**Not root cause (symptoms, don't chase these):** "the designer should have
weighted her own open question 2 higher" (she raised the right concern and
was told by critic it was already fixed by the reveal-endpoint plan — the
plan just didn't fix it), "the engineer should have encrypted from the
start" (nothing in FINAL.md asked for encryption at all — signing was the
locked mechanism, and the engineer built exactly that correctly before QA
named the deeper problem).

## Is this a repeat, or a new failure class?

**A repeat — this is the second occurrence, and it crosses the reviewer
2+-occurrence bar.** Both v1 and v2 shipped (or nearly shipped) the same
underlying error: *content meant to be protected/gated was placed inside
something served directly to the browser via a public URL, and the
"protection" applied to it (encoding, or encoding+signing) did not provide
confidentiality — only obfuscation and/or tamper-detection.* The variable
between the two occurrences is only which loop stage caught it:

- v1: the change (base64 payload as the id, no signature at all) never
  reached critic — it was requested directly to engineer, outside the loop
  (per RETRO-2.md), so there was no round-1 check to fail. It sat on main
  until someone noticed.
- v2: the change *did* reach critic, round 1 correctly flagged the general
  shape of the problem, but the prescribed and adopted fix left the same
  underlying mechanism (payload readable straight out of the id) in place
  under a "moved server-side" label that didn't actually apply to the id
  itself. QA caught it instead.

That's meaningfully different from v1's *original* RETRO.md P1 (a
spec-precision gap on an exact-string guardrail check — a different kind of
bug, about invariant-vs-mechanism, not about URL exposure) and from v1
RETRO-2's root cause (a *process/governance* gap — no rule routes
out-of-band requests through critic before merge). This occurrence's root
cause is neither of those: it's a **content-in-a-public-URL confidentiality
check that critic's review process does not currently prompt for**, and
it's now failed to get caught at the design-review stage twice — once
because the review never happened, once because the review happened but
didn't ask the one question that would have found it. Two occurrences,
same missing check, different reasons the check didn't run. That's the
pattern the 2+-occurrence bar exists for.

## Process changes

**Edited `agents/critic/AGENT.md`** — added a URL/link-exposure check to the
Role section: for any design (or prescribed fix) that puts derived, encoded,
or signed-but-unencrypted data into a public URL or other client-visible
token the app hands out, critic must explicitly ask "can this be decoded
into the protected content with zero server involvement?" and verify a
proposed fix actually changes the answer to that question, not just where
in the response the data appears. Reason: two occurrences (v1's unsigned
id-is-the-content bypass, v2's signed-but-unencrypted id-is-the-content
fix-that-wasn't) of design/fix approvals that didn't survive this exact
mechanical test, closable by adding one question to the review rather than
by restructuring anything.

No `loop/LOOP.md` edit this cycle — this is a review-content gap (what
critic checks for), not a sequencing/governance gap (when critic runs),
which is the class of problem v1 RETRO-2.md's still-open watch item covers
and remains at 1 occurrence, unrecurred this cycle since v2 went through
the loop in full.

## Watch items (not yet a process change)

- **SHARE_SECRET has no entropy floor.** Flagged by critic in DISCUSSION-2.md
  as a pre-existing condition (present since v1's HMAC scheme, unchanged by
  the v2 AES fix): `getSecret()` accepts any string in production, no
  length/randomness check. Not blocking either release since it predates
  both and nothing about v2 made it worse, but it's the same *shape* of gap
  as this cycle's process change — a security-relevant property nobody
  checks mechanically — so it's named here rather than left to be
  rediscovered. One occurrence as a flagged-but-unaddressed gap, not two as
  a shipped bug; backlog item, not a process change.
- **No format/version byte in the encrypted blob** (`iv||tag||ciphertext`,
  no discriminator) — DISCUSSION-2.md called this fine for now, cheap to add
  if the encoding ever changes again. Purely a forward-compat note, not a
  defect.

## What should FINAL.md/DISCUSSION.md have done differently
DISCUSSION.md's fix language ("`original` stays server-side until a real
request asks for it... this is not new plumbing, it's the same decode
function behind one more route") was correct about the page's rendered
props and wrong about the id, and nothing in either document ever states
what the id itself is allowed to contain — the same gap QA.md's own
"Design-defect note" already named for future FINAL.md revisions. The
critic AGENT.md edit above is the mechanical version of that note: a
question asked at review time instead of a note added after the fact.

## Should this have been caught earlier?
Yes, at DISCUSSION.md round 1, by running the check now added to
`agents/critic/AGENT.md` against the designer's own prescribed fix, not just
against the original DESIGN.md draft. The gap wasn't a hard problem — it's
one `Buffer.from(id, 'base64url').toString()` away from obvious — it just
wasn't a question anyone in the loop was structurally prompted to ask.
