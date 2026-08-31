# v5 Release Notes

**Version:** 5.0.0  
**Released:** 2026-08-31  
**Preview:** https://trsl-o81ee9uym-sangtae-ahns-projects-38b219ff.vercel.app  
**Production:** https://trsl.vercel.app

---

## What's New

### Editable Translation Draft
The sender can now edit the AI's translated wording before sharing. Select a variant, tap **Edit**, and modify the text in place. Tap **Reset to AI draft** to revert. Whatever text is in the textarea when Share is pressed is what gets encoded — no stale snapshots.

**Why this matters:** Phase 2's north star is "does the reveal feel worth $1" — which depends on the sender trusting the translated message enough to send it. Right now, if a variant is 90% right, the only recourse is regenerate-and-hope. Edit removes the single largest reason to bail right before commit.

### Server-Side DECLINE Re-check on Edited Text
When the sender edits the translated text, the server re-runs the DECLINE guardrail check before issuing a share link. This closes the bypass the edit feature introduces — whatever the sender typed ships through the same content moderation as the AI's output. Unedited shares pay zero extra latency or API cost.

**Why this matters:** The DECLINE guardrail's invariant is "nothing reaches encodeShareId without having survived the check first." Edit would have broken that invariant. Re-checking on the server side (never trusting a client flag) closes the gap without tuning the guardrail itself.

### ARIA Compliance for Card Selection
Variant cards now use native radio inputs with labels, not hand-rolled `role="radio"` with nested focusable elements. The textarea sits outside the label when editing — no focusable descendant inside radio semantics. Screen readers announce cards correctly; clicking the textarea never triggers card selection.

**Why this matters:** The old pattern broke screen reader navigation (radio widgets aren't expected to contain focusable descendants) and had undefined click-bubbling behavior. Native radio inputs fix both for free.

### Visual Refinements
- **Focus states:** All interactive elements now have `2px solid #a5b4fc` focus rings (8.7:1 contrast, replacing the inaccessible `#4f46e5` at 2.78:1)
- **Selected card tint:** `#1c1a2e` fill alongside the existing `#4f46e5` border — subtle but present
- **Wordmark:** Weight 700, `-0.02em` letter-spacing — confident without shouting
- **Spacing scale:** Formalized 4/8/12/16/24/32/40 scale applied consistently
- **Surface hierarchy:** Inputs recede (`#161616`), cards present (`#1a1a1a`), selected cards lift (`#1c1a2e`)
- **Chip hierarchy:** Unselected chips recede (`#333` border, `#888` text), selected chips stand out (accent fill, white text)

**Why this matters:** The app now looks like something worth paying $1 for. Text breathes, surfaces create depth, and interactive elements respond to focus/hover. The visual refinements are restrained (no new colors, fonts, or shapes outside BRAND.md) but the cumulative effect is "considered" instead of "default."

---

## What's Not New

- **Prompt/output-quality rewrites:** v5 is not a prompt pass. Tone distinctness and DECLINE accuracy are unchanged from v4 (see v4/RETRO.md for the accepted risk on DECLINE threat-detection).
- **DECLINE guardrail accuracy work:** Re-running the existing check on edited text is in scope; changing what the check considers a violation is not.
- **"Write your own translation from scratch" mode:** AI draft is always the default; editing is optional, not a parallel authoring path.
- **Editing non-selected variants:** Only the selected card gets an edit affordance.
- **New visual world / rebrand:** This is refinement of the incumbent identity in BRAND.md, not a replacement.

---

## Known Issues

**None.** All 30 acceptance criteria pass (see QA.md).

---

## Deployment

- Preview deployed: 2026-08-31
- QA verdict: SHIP
- Production deployed: 2026-08-31
- Tag: v5.0.0

---

## Files Changed

### Code
- `app-trsl/src/app/page.tsx` — Editable variant feature, visual refinements, ARIA fix
- `app-trsl/src/app/globals.css` — Focus states (#a5b4fc), hover states, transitions
- `app-trsl/src/app/api/share/route.ts` — DECLINE re-check on edited text

### State
- `state/versions/v5/PRIORITY.md` — Re-scoped after rogue-subagent incident
- `state/versions/v5/DESIGN.md` — Re-derived from PRIORITY.md
- `state/versions/v5/DISCUSSION.md` — Critic's blockers addressed
- `state/versions/v5/FINAL.md` — Final spec with both blockers resolved
- `state/versions/v5/VISUAL.md` — Visual refinement pass
- `state/versions/v5/QA.md` — All 30 acceptance criteria pass
- `state/versions/v5/DEMO-pm.md` — PM demo evaluations
- `state/versions/v5/DEMO-designer.md` — Product designer demo evaluations
- `state/versions/v5/DEMO-ui.md` — UI designer demo evaluations
- `agents/BRAND.md` — Inline-edit pattern, spacing scale, focus/hover tokens
- `state/ROADMAP.md` — Phase 2 progress updated
- `.gitignore` — Added remotion/node_modules/, remotion/out/

---

## Rollback Plan

If v5 causes issues in production:
1. Revert to v4 tag: `git checkout v4.0.0`
2. Redeploy: `vercel --prod --yes`
3. No data migration needed (v5 is purely client-side + one new API check)

---

## Post-Release Monitoring

- Watch Vercel analytics for translation API errors (especially DECLINE re-check failures)
- Monitor for users hitting the "Unable to verify message" error (should be rare)
- Check if edit feature is being used (look for share URLs with edited text vs. original variants)
- Verify focus states work across browsers (Safari, Firefox, Chrome)

---

## Credits

- **Engineer:** Implemented editable variant, DECLINE re-check, ARIA fix, visual refinements
- **Product Designer:** Re-derived DESIGN.md/FINAL.md after rogue-subagent incident, specified edit mechanics
- **Critic:** Identified two blockers (DECLINE bypass, ARIA violation) and accessibility corrections
- **UI Designer:** Specified visual refinements (VISUAL.md), evaluated demo
- **QA:** Verified all 30 acceptance criteria, no blockers
- **PM:** Approved demo Round 1, held Round 2 (focus states — now fixed)
- **Release Manager:** This document, version bump, tag, production deploy

---

## What's Next

v5 advances Phase 2 ("prove wife will pay") on two of its three stated legs:
1. **Visual bar** (explicitly named in ROADMAP.md) — now met
2. **Sender trust in translated output** (previously assumed prompt work alone would suffice) — now has a correction path when the AI doesn't nail it
3. **Recipient conversion** (does the $1 unlock feel worth it?) — still open, needs real-world testing

v6 candidates (see backlog.md):
- Sender-customizable OG image (conditional on v5 landing)
- DECLINE guardrail threat-detection work (accepted risk from v4, first-priority backlog)
- Share page visual refinements (bold gesture on the one surface a non-user sees)
