# trsl harness loop

One iteration = one version. Run via `/trsl-loop`.

This is not a strict pipeline — it's a graph with one designated release
gatekeeper. Every stage below runs forward by default; the two backward
edges (critic's `revise`, and the demo round) are where it actually
branches. **PM holds final release authority** (see "Release authority"
below) — the numbered list is the default forward path, not a guarantee of
one-shot linear execution.

## Stages (default forward path, each a real subagent spawn)

```
0. pm                         -> state/ROADMAP.md, state/versions/vN/PRIORITY.md
1. product-designer (draft)   -> state/versions/vN/DESIGN.md
2. critic                     -> state/versions/vN/DISCUSSION.md
3. product-designer (finalize)-> state/versions/vN/FINAL.md
3.5 ui-designer               -> state/versions/vN/VISUAL.md
4. engineer                   -> code + CHANGELOG.md (or ENGINEERING-NOTES.md if blocked)
5. qa                         -> state/versions/vN/QA.md  (verdict: ship | block)
   - if block: back to step 4, once. still blocked after that -> stop iteration,
     leave QA.md as-is for a human to look at.
5.5. demo                     -> preview deploy + state/versions/vN/DEMO.md
   - critic/product-designer/ui-designer hold: back to step 3, once. Still held after
     that -> ships anyway with dissent logged (advisory, not a hard gate).
   - pm hold: hard gate, see "Release authority" below -> cycles back until
     pm ships or the circuit breaker trips.
6. release-manager            -> state/versions/vN/RELEASE.md, version bump, tag
   (requires pm's `ship` in the latest DEMO.md — see below)
7. reviewer                   -> state/versions/vN/RETRO.md, backlog.md update,
                                  possible edits to agents/*/AGENT.md and this file
```

### 5.5. Demo round

Everything before this point only ever showed pm, product-designer, and ui-designer the
*spec* (PRIORITY/DESIGN/FINAL/VISUAL) — never the actual built thing, until it was
already live. Demo closes that gap: once QA verdicts `ship`, deploy a **preview** (not production — `vercel deploy` without `--prod`, same project, throwaway URL) and have the four taste-holders — **pm, product-designer, ui-designer, critic** — actually use it, for real, the way a receiver/sender would. Engineer and QA don't re-run here; their job (does it work, does it match FINAL.md and VISUAL.md) is already done. This stage is purely "does the finished thing still earn the taste bar we set," using each persona's own `## Taste` section as the lens.

Each of the four spends a short pass on the live preview (use `browser-use` for anything interactive, per `agents/qa/AGENT.md`'s pattern) and appends a **dated "Round N" section** to `state/versions/vN/DEMO.md` (never overwrite a prior round — the full back-and-forth is what the circuit breaker reports if pm never ships) with: a gut reaction from their taste, and a verdict — `ship` or `hold` (hold = something about the *finished* thing, not the spec, doesn't sit right; name it concretely, same discipline as critic's DISCUSSION.md objections).

**critic, product-designer, or ui-designer holds** (pm ships): advisory, one round back to product-designer (finalize) to adjust FINAL.md/scope or ui-designer to adjust VISUAL.md, same shape as critic's normal DISCUSSION round. Still held after that round — ship anyway, dissent logged into RELEASE.md and reviewer's retro, don't block indefinitely. These three don't have release authority; pm's `ship` is what actually clears this stage.

**pm holds**: see "Release authority" below — this is the one verdict in
DEMO.md that actually blocks release-manager.

PM runs at step 0 every iteration, same cadence as everything else — it's a
stage, not a separate loop. Split it into its own outer loop only if it ever
needs a different cadence (e.g. strategy review every 5 versions instead of
every 1). PM's second appearance, at the demo round, is where release
authority actually lives — see below.

## Release authority

PM decides whether this iteration ships, not release-manager. Release-manager
is execution — it checks the boxes (QA `ship`, pm `ship`) and does the
mechanical work of releasing; it doesn't make judgment calls, and it will
not proceed without both.

If pm holds at the demo round, the loop goes back — pm's call which stage:
straight to engineer for a narrow build-level fix, to product-designer
(finalize) if scope/FINAL.md needs to change, or as far back as PRIORITY.md
if pm decides the whole premise for this iteration was wrong. Whichever
stage pm sends it to runs its normal forward path back to another demo round
— this can repeat; there's no fixed cap on how many times pm can send it
back, unlike critic/product-designer's one-round advisory holds above.

**Circuit breaker**: after 3 total demo rounds without a pm `ship`, stop the
iteration and report to the human instead of cycling again or forcing a
release — at that point the disagreement is data a human should see, not
something to keep resolving autonomously. Log the full DEMO.md history
(every round, not just the last) so the human sees the actual back-and-forth,
not just the final impasse.

No stage skips its predecessor's file — each subagent's prompt includes the
exact state file(s) it must read.

## State layout

```
state/
  backlog.md              running list of candidate work + "Shipped" log
  ROADMAP.md              vision, north star, current phase (owned by pm)
  versions/
    v1/PRIORITY.md
       DESIGN.md
       DISCUSSION.md
       FINAL.md
       VISUAL.md
       CHANGELOG.md
       QA.md
       DEMO.md
       RELEASE.md
       RETRO.md
```

`vN` = next integer after the highest existing `state/versions/vN` directory.
`v0` doesn't exist; the first run is `v1` and seeds its backlog read from
`state/backlog.md`'s initial seed (derived from README.md).

## Self-evolution

Only the **reviewer** persona edits `agents/*/AGENT.md` or this file, and only
in step 7, and only for patterns repeated across 2+ RETRO.md files — see
`agents/reviewer/AGENT.md`. Every edit is logged in that iteration's RETRO.md.
This is the only mechanism by which the loop changes itself; no other stage
touches process files.

## Human override

Any stage's subagent can be re-run manually by invoking `/trsl-loop step=N`
if a human wants to intervene mid-iteration instead of letting the loop
auto-advance.
