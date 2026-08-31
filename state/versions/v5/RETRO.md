# v5 RETRO

## What shipped

Editable translation draft: sender can edit the AI's wording before sharing, with server-side DECLINE re-check closing the bypass the edit feature introduced. ARIA fix (native radio inputs, textarea outside label). Visual refinements per VISUAL.md (focus states, selected card tint, wordmark weight, spacing scale, surface hierarchy).

QA: 30/30 acceptance criteria pass, no P0/P1 bugs.  
Demo: PM held Round 2 (focus states incomplete), fixed in this implementation.  
Production: https://trsl.vercel.app, tag v5.0.0.

## What worked

**Critic caught real blockers.** Both DISCUSSION.md blockers were genuine:
1. DECLINE bypass on edited share text — a real security gap the edit feature introduced. The fix (server-side re-check, never trust client flag) is correct and efficient (unedited shares pay zero cost).
2. ARIA violation — textarea inside `role="radio"` would have broken screen readers and had undefined click-bubbling. The fix (label wraps only static text, textarea outside) is clean.

If the critic had rubber-stamped DESIGN.md, these would have shipped as bugs. The critic's discipline (reading the code, tracing the security invariant in share.ts, checking ARIA semantics) prevented two P0s.

**Engineering matched FINAL.md precisely.** All 30 acceptance criteria passed on first QA pass. No drift, no scope creep, no "I also fixed..." The engineer read FINAL.md, built to spec, and stopped. This is what the loop should look like when every stage does its job.

**Demo rounds served their purpose.** PM shipped Round 1 (core loop works), held Round 2 (focus states broken). The hold was specific and actionable. The implementation fixed the focus states. The circuit breaker didn't need to trip — the hold resolved in one round.

**Visual refinements are restrained.** No new colors, fonts, or shapes outside BRAND.md. The #1c1a2e selected-card tint is a judgment call (accent mixed into card background at low opacity), but it's documented and checkable. The focus ring moved from #4f46e5 (2.78:1 contrast, WCAG fail) to #a5b4fc (8.7:1 contrast, accessible). Small change, big accessibility win.

## What didn't work

**Rate limit blocked the Claude agent mid-implementation.** The Claude agent in pane `wA:p1` hit a session rate limit during the "Product-designer finalize v5" stage. The session showed "You've hit your session limit · resets 11:10pm (America/New_York)" and auto-resumed at the reset time, but the work was incomplete. The user had to manually intervene ("look into claude agent's pane... resume it's work since it's being blocked by limit") and I (this pi session) completed the implementation.

**Root cause:** The rate limit is a hard constraint of the Claude API, not a loop design issue. The loop can't prevent rate limits. However, the loop should be resilient to them. The v4 RETRO added a rule that resumed subagents must stop and report once their task is complete — that rule applies here too. The Claude agent auto-resumed at 11:10pm but didn't complete the work; it just restarted the loop without finishing the product-designer finalize stage.

**This is a first occurrence** — per this persona's 2+-occurrence bar, this would normally mean "watch item, not a rule." Documenting it here so if it recurs, we know to add a harder safeguard (e.g., explicit "did the stage actually complete?" check before the loop advances).

**.gitignore was incomplete.** The `remotion/` directory and `.DS_Store` files were accidentally committed in the v5 release commit. The `.gitignore` had `remotion/node_modules/` and `remotion/out/` but not `remotion/` itself. Fixed in a follow-up commit, but the damage (4000+ lines of node_modules in git history) is done.

**Root cause:** The `.gitignore` was built incrementally as new directories appeared, rather than being comprehensive from the start. A `remotion/` directory was created (for a video project) and only its subdirectories were ignored, not the directory itself. When `git add -A` ran, it picked up everything not explicitly ignored.

**This is a first occurrence** — documenting it here. If it recurs, the fix is a pre-commit hook that warns on large additions (e.g., >100 files or >1MB), or a more aggressive `.gitignore` that ignores all `node_modules/` and `.DS_Store` at any depth.

## Patterns to watch

**Rate limits as a loop disruption.** If a subagent hits a rate limit mid-stage, the loop pauses. When it resumes, the subagent should verify its stage is actually complete before advancing. Right now there's no mechanism for that — the v4 rule says "stop and report once complete," but if the subagent never reached completion, it's ambiguous whether it should continue or restart. Watch for this pattern. If it recurs, add an explicit "stage completion check" to the loop: before advancing to the next stage, verify the artifact (FINAL.md, QA.md, etc.) exists and is non-empty.

**Incremental .gitignore.** If new directories keep appearing and getting partially ignored, the `.gitignore` will keep having gaps. Watch for this pattern. If it recurs, switch to a comprehensive `.gitignore` that ignores all `node_modules/` (at any depth), all `.DS_Store`, all build artifacts (`.next/`, `dist/`, `build/`), and all environment files (`.env*`). Better yet, use a template `.gitignore` from a trusted source (e.g., GitHub's Next.js template) rather than building incrementally.

## Known open items carried into backlog

**None new.** The v4 backlog item (DECLINE guardrail threat-detection regression) is still open but was explicitly out of v5 scope per PRIORITY.md. It remains top of the backlog for v6.

The v5 scope (editable draft + visual refinements) is complete. The next backlog items are:
- DECLINE guardrail threat-detection work (carried from v4)
- Sender-customizable OG image (v6 candidate, conditional on v5 landing)
- Share page visual refinements (bold gesture on the one surface a non-user sees)

## Process changes

**None.** Both issues (rate limit block, incomplete .gitignore) are first occurrences. Per this persona's 2+-occurrence bar, no process changes this iteration. If either recurs, that's the signal to add a harder safeguard.
