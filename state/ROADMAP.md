# Roadmap

## Vision
trsl gives husbands who can't say something straight a way to say it anyway:
write it raw and unfiltered, trsl turns it into something sendable, and the
output is built to travel — dropped straight into iMessage, WhatsApp, or an
IG DM — with the original unfiltered version held back as something the wife
can unlock for $1.

## Phase 1 (shipped): prove the core translate+share loop works end-to-end as a real deployed/runnable product
Done. v1 is live at https://trsl.vercel.app — real deploy, real translate
call, HMAC-signed shareable links, OG-ready for iMessage/WhatsApp/IG DM. The
core loop works; the rest of the roadmap can now build on top of it instead
of hoping it will.

## Phase 2 (current): prove wife will pay — value-unlock concept + visual bar + output bar
v1 proved the mechanics work but shipped visually plain (functionally
complete, "no design investment" per RETRO.md). Phase 2 has three jobs now,
all serving the same "worth paying into" question: prove the $1
pay-to-reveal-original mechanic is worth building for real (start with a
mock paywall — no live Stripe yet), raise the visual bar enough that the
product feels worth paying into rather than a functional prototype, and
(added v3) raise the *output* bar — the translated text itself has to read
as a credible, on-target rendering of what the sender meant, or there's no
real gap between translated and original to pay for. v3 added this third
leg after a direct product-owner report that translations sometimes read
out of context/nonsensical; `translate()` had zero situational input beyond
the raw message, so this was a missing-input gap, not a new phase. These
aren't sequenced as separate phases because the paywall's *conversion* —
does a wife actually want to tap "unlock," and does what she reveals feel
like it was worth $1 — is a design, motion, *and* output-quality question
at once; testing the concept on a visually flat or contextually broken
surface would confound the result either way.

**North star for this phase:** a real recipient, on a real deployed link,
taps the mock $1 unlock and the reveal feels like it was worth the tap —
validated by real usage/reaction, not just "the button works."

## Later phases (not sequenced yet)
- Real Stripe integration (once the mock paywall validates the concept)
- Growth / virality (what makes it spread beyond the first sender)
