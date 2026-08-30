# v4 PM Demo — Round 1

**Date:** 2026-08-30  
**Preview:** https://trsl-p3dx2h00h-sangtae-ahns-projects-38b219ff.vercel.app

## What I tested

1. **Sender flow**
   - Typed a raw message, selected a tone chip ("Direct but kind"), and added context.
   - Pressed Translate — received 3 variant cards.
   - Selected a different variant (selection state moved correctly).
   - Pressed Regenerate.
   - Pressed Share — share ID was written to `localStorage`; I constructed the receiver link from the last stored ID.

2. **Receiver flow (fresh `browser-use` session)**
   - Opened the shared `/m/[id]` link.
   - Saw the chosen translated message and a "View original — $1" button.
   - Tapped the button — label changed to "Unlock the original — $1".
   - Tapped again — original was revealed with the existing reveal animation.

## PM taste reaction

The mechanics are in place, but two things keep this from feeling trustworthy:

1. **Input reliability is inconsistent.** In the first session, the composer auto-populated with content that did not match what I typed (raw message about dishes, context about chores became a revealed original about forgotten milk and errands). The second session captured my inputs correctly, but a user cannot have a 50/50 chance that their raw message is the one being translated. If the sender does not trust that the app is working on *their* text, nothing else in Phase 2 matters.

2. **The rate limit undercuts the core loop.** I hit "Too many translation requests. Please wait a minute" after one translate and one regenerate. v4's whole pitch is "iterate until one lands"; a cap that blocks iteration on the second try turns the feature into a one-shot slot machine — exactly what PRIORITY.md said we were fixing.

3. **Receiver transition is weaker than FINAL.md described.** Tapping "View original — $1" only relabels the button to "Unlock the original — $1"; it does not transition into a distinct mock-paywall state with the blur cross-fade called out in FINAL.md. The reveal still works, but the curiosity-paywall-reveal rhythm is flattened into two button labels.

The variant cards, selection state, and final reveal animation all look and behave as designed. The problem is that the loop around them feels fragile.

## Does this advance Phase 2?

Phase 2's north star is: *a real recipient taps the mock $1 unlock and the reveal feels worth the tap.*

A recipient who gets this link can tap through and see an original. That is forward motion. But the sender-side iteration — the thing that is supposed to make the translated message worth sending — is currently unreliable and rate-throttled. If senders do not confidently land on a message they want to send, there is no worthy reveal for the recipient to pay into. So this only half-advances the north star.

## Verdict

**hold**

## Loop back to

**engineer**

- Fix the composer input/state bug so the raw message and context the user enters are exactly what gets translated and stored.
- Re-tune the per-IP rate limit (and/or the daily spend ceiling) so a user can reasonably complete the designed loop: translate → regenerate at least once → share. A limit that fires on the second request is incompatible with the iteration surface we are shipping.

Once those are fixed, a second PM demo round should re-run the same sender/receiver walkthrough. The receiver transition can be tightened in that same pass if the engineer fix does not naturally produce the blur paywall state described in FINAL.md.
