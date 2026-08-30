# v4 Critic Demo Round

## Round 1 — 2026-08-30

### Risk / ethics taste reaction

The built thing is noticeably less coercive than the design I objected to.
The receiver now sees **"View original — $1"** before any tap, so the
paywall is a disclosed choice, not a bait-and-switch. That single change
removes the darkest pattern in the v4 proposal.

The sender side also feels more honest: three variants plus Regenerate is
a real iteration surface, and the selected variant is what the receiver
actually sees. The receiver still has no idea the sender shopped among
options, but that was accepted in FINAL.md as a trust tension to monitor,
not a v4 blocker.

Residual taste concerns, none blocking:

- The model still declines `"test message"` (a QA-noted edge case). It is
  not a realistic partner message, so it does not block ship, but it is a
  reminder that the guardrail is a blunt instrument.
- The model occasionally answers the user ("Hello! How can I assist you
  today?") instead of translating low-context inputs. This is a quality
  issue, not a safety issue.
- The rate/cost cap is best-effort on Vercel serverless (in-memory store).
  The code is honest about this ceiling; it stops casual abuse but not a
  determined actor spreading requests across instances.

### DISCUSSION.md blockers — closed or not?

| # | Objection | Built thing | Verdict |
|---|-----------|-------------|---------|
| 1 | 3x cost increase with no rate/cost cap | `/api/translate` enforces a per-IP sliding window (live test hit 429 after rapid calls) and a hard daily spend ceiling in `rate-limit.ts`. UI surfaces the 429 cleanly. | **Closed** |
| 2 | Hidden price on "View original" | Receiver button copy is exactly **"View original — $1"**; the price is visible before the tap. | **Closed** |
| 3 | Batch guardrail weakened by variants/regenerate | Post-check discards the entire batch if any variant starts with `DECLINE`. Direct threat input returns `{"declined":true}` with no variants rendered. Benign short input `"fine"` returns variants. | **Closed** |

### Verdict

**ship**

All three blockers from DISCUSSION.md are resolved in the deployed v4
preview. The upfront price disclosure and backend rate/cost cap turn the
feature from a likely rejection risk into something that can ship and be
learned from. The remaining concerns are model-quality rough edges, not
ethical or safety blockers.
