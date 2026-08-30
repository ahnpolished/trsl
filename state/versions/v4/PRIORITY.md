# v4 Priority

## Item
Rework the sender and receiver flows so the product feels like a
**translation tool the sender iterates with**, not a one-shot slot machine,
and so the receiver **discovers** the hidden original before hitting the
paywall.

Sender side:
- Generate multiple translated options (default 3) from one raw message +
  optional tone/context.
- Let the sender pick one, or ask for a fresh batch, until they're
  satisfied.
- Only then share.

Receiver side:
- The shared link shows the chosen translated message and a quiet
  "View original" affordance.
- Tapping "View original" surfaces the mock $1 paywall.
- Paying reveals the original, same as today.

## Why this, why now

v3 raised the output bar (tone + context), but the sender still gets one
take and is forced to share or abandon. In practice that means a bad
translation is a dead end, and a good translation still feels like luck.
Multiple options + regenerate turns the composer into something the sender
can actually steer, which is the precondition for them to trust the app
enough to send the result to their partner.

The receiver change is smaller but equally important for the paywall's
conversion. v2/v3 show the "$1 unlock" button immediately, which frames the
hidden content as a product feature up for sale. The user's intended flow
frames it as a secret the receiver uncovers — "View original" is
curiosity-driven, and the paywall appears only after the receiver has
already decided they want to see it. That ordering is more honest and
likely converts better.

Both changes advance Phase 2's north star: a real recipient taps unlock and
the reveal feels worth the tap. The sender-side iteration makes the
translated message worth sending; the receiver-side reframing makes the
unlock feel like the receiver's choice.

## What's in scope

- Generate 3 translation variants per request by default.
- Display variants as selectable cards/options in the composer.
- "Regenerate" button to fetch 3 new variants.
- Selected variant is the one that gets shared.
- Replace the current "Unlock the original — $1" button on `/m/[id]` with
  a "View original" button.
- Tapping "View original" transitions to the mock $1 paywall state.
- Paywall tap then reveals the original, with the same animation as v2/v3.
- Keep tone chips and context input from v3; they now apply to every
  regeneration.
- Keep the existing DECLINE guardrail, share-id encryption, and sender/
  unlock localStorage flags unchanged.

## Not now

- Real Stripe integration (still deferred; mock paywall only).
- Editing a generated message inline — if the sender wants something
  different, they regenerate or pick another variant.
- Letting the receiver reply or react.
- Letting the sender save favorite translations across sessions.

## Known consequences

- Cost per translate request triples by default (3 variants × 1 call's
  tokens each). This accelerates the already-open rate-limiting/cost-
  control backlog item; v4 should not ship without at least a basic cap.
- More UI surface in the composer means more keyboard/accessibility paths
  to verify.

## Phase

Continues Phase 2 ("prove wife will pay") — specifically the "worth paying
into" half, applied to sender trust and receiver framing.
