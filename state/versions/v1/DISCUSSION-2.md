# v1 Discussion — Retroactive (HMAC share-id fix)

Reviewing after the fact: an out-of-loop "deploy prep" change dropped Vercel
KV for a stateless, content-derived `/m/<id>` (base64url of `{t: text}`),
which meant anyone could hand-craft a URL with arbitrary text and get it
rendered as a branded trsl share page — the DECLINE guardrail only runs in
the translate route, so direct URL access bypassed it completely. That's
since been patched with HMAC-SHA256 signing (`app-trsl/src/lib/share.ts`,
commit `8ad72af`). This is that patch's DISCUSSION pass, done after the fact
because the original change skipped the loop.

## Does the fix close the hole?

Yes, for the vulnerability as described. `encodeShareId` is called from
exactly one place (`src/app/api/translate/route.ts`), only after the
DECLINE check passes. `decodeShareId` verifies the signature with
`timingSafeEqual` before trusting the payload, and a mismatched or absent
signature returns `null` → `notFound()`. Without `SHARE_SECRET`, forging a
signature that verifies is computationally infeasible — this isn't "harder
now," it's closed. Every `/m/<id>` that renders content was signed by a
DECLINE-checked translate call. Good.

## Objections

**1. The dev-secret fallback is a live production risk, not just a
local-dev convenience (real, not blocking).** `getSecret()` only refuses to
use `DEV_SECRET_FALLBACK` when `NODE_ENV === "production"`. That's correct
on Vercel (prod and preview deploys both set it), but the fallback string
is hardcoded in a source file that's presumably in git history — anyone who
can read the repo can compute forged signatures against it. If this app is
ever deployed somewhere that doesn't reliably set `NODE_ENV=production`
(self-host, Docker without the env var wired up, a different PaaS), the
app degrades *silently* to using a publicly-known secret — no crash, no
log, just a signature scheme that verifies nothing. The check should fail
closed on "`SHARE_SECRET` is unset," not "we're not sure we're in prod."
Fix: gate the fallback on an explicit `NODE_ENV !== "production" &&
process.env.ALLOW_DEV_SECRET` (or just require `SHARE_SECRET` unconditionally
outside `next dev`), rather than inferring safety from a variable this app
doesn't control being set correctly by whoever deploys it.

**2. Secret rotation silently breaks "permanent" links (accepted risk, name
it, don't fix it now).** FINAL.md says links are permanent in v1 by design
(no delete UI, no expiry). Rotating `SHARE_SECRET` — e.g. after a leak —
invalidates every previously issued link at once, with no recovery path
(there's no DB copy of the payload to re-sign against). That's an inherent
trade of the stateless design, not something this patch could have avoided,
but it should be written down somewhere an operator will see it before they
rotate the secret assuming it's a routine credential swap. Not a blocker on
this fix; a gap in FINAL.md/README's ops notes.

**3. Timing-safety and truncation are both fine, checked so I don't have to
re-check them later.** `timingSafeEqual` is used correctly and only after a
constant-time-irrelevant length check (length itself isn't secret — it's
fixed at 22 chars by construction). The digest is truncated to 22 base64url
chars (~132 bits) — nowhere near a brute-forceable range. No objection.

**4. The DECLINE guardrail's *own* reliability is untouched by this fix
(not this fix's job, but don't let "the URL hole is closed" read as "the
guardrail is solid").** This patch closes the direct-URL bypass. It does
nothing about the model being talked out of saying `DECLINE` in the first
place (prompt injection in the raw input). That was true before KV was
removed and is true after this fix — just flagging it so it isn't mistaken
for closed by this review.

## The loop-bypass problem (separate from the technical fix)

The vulnerability didn't originate in bad code — the HMAC fix itself is
clean. It originated in a security-relevant decision (derive share IDs from
content instead of opaque random tokens, with no signing) getting made and
shipped under the banner of "deploy prep," which nobody treated as the kind
of change that needs a Critic/QA pass. "Removing a database dependency" reads
as infra housekeeping; "changing what makes a share ID unforgeable" is a
security decision wearing an infra-change costume. Those are the same diff.

Worse: the fix for it *also* shipped without a DISCUSSION pass — this
document is that pass, done retroactively, only because it happened to catch
nothing worse than the two notes above. Nothing about the process stopped a
bad fix from landing the same way the bug did; it was correct this time by
the engineer's own care, not because the loop caught it before ship.

Recommendation for the next retro: changes to `share.ts` or anything else
that decides whether unauthenticated content becomes a rendered public
page should require a DISCUSSION pass before merge, not after. This is a
watch item, not (yet) a rule — RETRO.md's own bar is 2+ recurring instances
before promoting a watch item to a process change, and this is the first.
But name it now so it's checked next time, not rediscovered.

## Verdict

**Sufficient to consider the URL-forging vulnerability closed.** The HMAC
fix does what it claims and the guardrail bypass it was built to close is
in fact closed. Objection 1 (dev-secret fallback trusting `NODE_ENV`) is a
real residual risk worth a follow-up fix but not a reason to reopen this as
unresolved — it's a defense-in-depth gap on a mechanism that's already
correct in the deploy target this app actually targets (Vercel). Objection
2 is an ops note, not a defect. Log both as follow-ups; don't block on them.

Separately: flag the loop-bypass pattern to whoever owns process, per above.
That's a process question, not a reason to withhold this verdict.
