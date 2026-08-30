# v4 Discussion

## Objections

### 1. 3x cost increase ships without a rate/cost cap (blocker)
**Risk:** `/api/translate` now spends roughly three API calls per sender interaction, and the design scopes the cap out as a "higher-priority backlog item." But `PRIORITY.md` explicitly says v4 "should not ship without at least a basic cap," and the backlog has carried rate limiting/cost control as open since v1.

**Why it matters:** An unauthenticated endpoint that spends real money just became three times cheaper to abuse. A single user clicking "Regenerate" a few times, or a trivial script, can burn the API budget 3x faster than today. The design's own "Known consequences" call this out; ignoring it in the acceptance criteria is asking for an incident.

**Fix or question back:** Make a basic cap part of v4 scope before ship. Minimum viable: a per-IP rate limit on `/api/translate` and a hard daily spend ceiling, with a clean user-facing error. It does not need a UI meter or admin dashboard in v4 — backend enforcement is the blocker. Question for the designer: `PRIORITY.md` says the cap is in; `DESIGN.md` says it's out. Which is the contract?

---

### 2. "View original" hides the price until after the receiver is already curious (blocker — dark pattern / trust)
**Risk:** The receiver reads the translated message, then taps a button labeled only "View original" with no price. The next screen is a $1 paywall. That is a hidden-cost / bait-and-switch pattern, and it happens inside an intimate message the receiver got from someone they trust.

**Why it matters:**
- **Wife lens:** The button reads as "show me the real message," not "this costs money." The paywall feels like a trap set by the app — and by extension the sender. It is more likely to erode trust than to convert.
- **Trust & safety / App Store review:** Delaying price disclosure until after a tap is exactly the kind of "deceptive pricing" pattern platform reviewers flag. The receiver also never consented to install the app or enter a commercial relationship; a hidden paywall makes the non-consensual commerce problem worse, not better.
- The design's stated goal — "the paywall appears only after the receiver has already decided they want to see it" — is honest about the behavioral intent and therefore honest about the manipulation.

**Fix or question back:** Disclose the price on `/m/[id]` before the tap. The smallest fix is copy: "View original — $1" or a small "$1" meta directly below the button. If the conversion thesis depends on hiding the price, the thesis is a dark pattern and should not ship. Question: is there any user-testing evidence that hiding the price improves conversion more than it increases abandonment and distrust?

---

### 3. Variant generation weakens the DECLINE guardrail unless the whole batch is one guardrail decision (blocker)
**Risk:** The design asks for three variants per request and lets the sender regenerate indefinitely. The current guardrail is a single-response prefix check on the literal token `DECLINE`. With three outputs and unlimited retries, a sender gets more chances to land a variant that does not start with `DECLINE` even when the raw content should be blocked. Acceptance criterion 12 only says the guardrail "still fires" — it does not say what happens when one of three variants fires, or whether the sender can simply select a non-declined variant.

**Why it matters:** v3 closed a real guardrail bypass by moving `context` into the user message. v4 reopens a selection-based bypass: even if one variant correctly declines, the sender can share another variant that softened the threat just enough to miss the literal-token check. Unlimited "Regenerate" clicks also create a brute-force surface against a stochastic model.

**Fix or question back:** Treat each batch as one guardrail decision, not three independent passes.
- Pre-check the raw message + context + tone with a single DECLINE probe; if it declines, return the existing `{ declined: true }` and show no variants.
- After any variant generation, check every returned string for the `DECLINE` prefix; if any variant declines, discard the whole batch and surface DECLINE.
- Tie regeneration limits to the rate/cost cap from objection #1 so a sender cannot brute-force variants.
- Add an explicit acceptance criterion: "If the input triggers the DECLINE guardrail, the API returns `{ declined: true }`, no variants are rendered, and the UI shows the existing DECLINE state."

---

### 4. The receiver has no hint the sender iterated through options (non-blocker)
**Risk:** The shared message is presented as a single deliberate choice, but the sender may have picked the third of three auto-generated options after several regenerations. The receiver might read it as the sender's own words and respond to the *person*, not to the model.

**Why it matters:** This is an honesty/trust tension, not a dark pattern. The product is already a translation layer; hiding that the sender shopped among generated versions is consistent with the existing premise. But it is worth noting because, combined with objection #2, the receiver is being sold access to a message whose authorship and selection process are opaque.

**Fix or question back:** No fix required for v4, but a future iteration should test whether receivers care. For now, the design's assumption (the shared message reads as a single deliberate choice) is acceptable.

---

## Risk and ethics concerns

- **Surprise commerce:** The receiver did not install the app, agree to terms, or expect a transaction. Showing a paywall after a "View original" tap makes the commercial nature of the interaction a surprise.
- **Relationship trust transfer:** If the receiver feels tricked by the paywall, the resentment lands on the sender too — the person who chose to route the message through this app.
- **Coercion surface:** The product's core mechanic already asks a partner to pay to see an unfiltered message. Hiding the price does not make it less coercive; it makes the coercion harder to anticipate.
- **Platform policy:** App Store and Play Store reviewers treat undisclosed costs harshly. The current "no price before tap" rule is a concrete rejection risk.

---

## Accessibility / heuristic pass/fail

| Check | Pass/Fail | Notes |
|---|---|---|
| Contrast (text on cards, selected/unselected borders) | Pass | Reuses existing BRAND.md pairs (`#eee`/`#1a1a1a`, `#fff`/`#4f46e5`, `#888`/`#1a1a1a`). |
| Focus indicators | Pass | Design explicitly says not to suppress native `outline`. |
| Feedback on every action | Partial | Translate has a loading state; the design does not clearly specify a loading state for "Regenerate" or disabled/loading state for "Share." Add criteria. |
| Visibility of system status | Pass | Selected variant is exposed to assistive tech as a single-select group; first variant selected by default. |
| Error prevention | Fail | No price is visible before "View original" tap, so the receiver cannot make an informed choice. |
| Price disclosure | Fail | Same as above — hidden cost is a heuristic failure, not just a conversion choice. |

---

## URL / link-exposure check

The v4 share pipeline is unchanged from v3: the `/m/[id]` token is HMAC-signed and AES-GCM-encrypted; it does not encode the original or translated message in plaintext. The translated message is rendered server-side from the decrypted blob, which is the intended disclosure. No new public-token exposure is introduced.

**Verdict:** Pass.

---

## Verdict

**revise**

Objections #1 (cost/rate cap), #2 (hidden-price dark pattern), and #3 (batch guardrail behavior) are all blockers. Each is fixable without changing the shape of the feature, but none should ship as specified. Objection #4 is a real trust tension worth monitoring, not a blocker.

If the team refuses to disclose the price before the "View original" tap or to add a backend cost cap in v4, escalate this from **revise** to **block**.
