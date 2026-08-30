# v2 Priority

## Picked
Two items, both in scope for this iteration:

1. **Mock $1 paywall** — a fake payment step that unlocks the original,
   unfiltered message for the receiver. No real Stripe integration yet
   (that's a later phase); this is the value-unlock *mechanism and UX*,
   not the billing integration.
2. **Real visual/design polish with fun animation** — v1 shipped
   functionally complete but visually plain (RETRO.md: "no design
   investment"); this raises the bar across the app, not scoped to one
   screen.

## Deviation from the one-pick rule
AGENT.md says pick one backlog item per iteration. Not doing that here:
the user set both of these directly and explicitly, by name, as this
iteration's scope — that's not a PM judgment call to override. The usual
rule exists so PM breaks ties between competing candidates using phase fit;
there's no tie to break when the owner has already picked. Next iteration's
PM pass reverts to picking one from the backlog as normal.

## Why these, now
Phase 1 proved the core loop is real and deployed. Phase 2 is "prove wife
will pay" — and Nolan's test applies again: trace it to the end. A mock
paywall on a visually flat surface doesn't actually test whether the
unlock is *wanted*, it only tests whether the button works — those are
different questions, and the north star for this phase is the former. The
two items are coupled, not two separate bets: the visual polish is what
makes the unlock feel like something worth $1 instead of a form field, and
the paywall is what the polish needs to be built around (the reveal
moment is the one place in the app where animation earns its keep,
not decoration bolted onto every screen). Building either alone risks
either a working-but-unconvincing mechanism or good visuals with nothing
consequential for them to dramatize.

## What's explicitly deferred
- Real Stripe/payment processing — mock only this iteration.
- Growth/virality mechanics — untouched, still phase 3+.
- Any backend changes to persist unlock state beyond what the mock paywall
  needs to demo the flow (e.g. no new payment/analytics infra).

## Phase this advances
Phase 2: prove wife will pay (value-unlock concept) + raise the visual bar
that the concept is tested against.
