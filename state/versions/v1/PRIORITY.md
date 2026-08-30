# v1 Priority

## Picked
Core flow: husband writes raw message -> app "translates" to a sendable
version -> shareable output (OG-ready link/image) for iMessage/WhatsApp/IG DM.

(From the backlog seed; the $1 paywall-to-reveal-original item is explicitly
deferred to phase 2 — see below.)

## Why this, now
Phase 1 has exactly one job: prove the core translate+share loop works
end-to-end as something real and deployed, not a mock. This is the only
backlog item that *is* that loop — everything else (the paywall, growth
mechanics) is downstream of it and meaningless if this doesn't work first.
Nolan's test applies directly: trace it to the end. If a husband can't
actually get a real link out and a real recipient can't actually open it,
there's no product to charge for or grow — so build the smallest version
that is real end-to-end (deployed, working translate call, real shareable
OG link) rather than a UI mock of the same flow. An 80%-solved version of
this — translation that works but no shareable link, or a link that isn't
OG-ready and dies on paste into iMessage — is a failed feature for this
phase, not a partial win.

## What's explicitly deferred
The $1 pay-to-reveal-original mechanic is real product but belongs to phase
2 ("prove wife will pay") — it presupposes the share loop already produces
something worth paying to unlock. Building it before the core loop is
proven would be sequencing the roadmap on hope instead of evidence.

## Phase this advances
Phase 1: prove the core translate+share loop works end-to-end as a real
deployed/runnable product.
