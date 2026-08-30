# trsl harness loop

One iteration = one version. Run via `/trsl-loop`.

## Stages (sequential, each a real subagent spawn)

```
0. pm                         -> state/ROADMAP.md, state/versions/vN/PRIORITY.md
1. product-designer (draft)   -> state/versions/vN/DESIGN.md
2. critic                     -> state/versions/vN/DISCUSSION.md
3. product-designer (finalize)-> state/versions/vN/FINAL.md
4. engineer                   -> code + CHANGELOG.md (or ENGINEERING-NOTES.md if blocked)
5. qa                         -> state/versions/vN/QA.md  (verdict: ship | block)
   - if block: back to step 4, once. still blocked after that -> stop iteration,
     leave QA.md as-is for a human to look at.
6. release-manager            -> state/versions/vN/RELEASE.md, version bump, tag
7. reviewer                   -> state/versions/vN/RETRO.md, backlog.md update,
                                  possible edits to agents/*/AGENT.md and this file
```

PM runs once per iteration, same cadence as everything else — it's a stage,
not a separate loop. Split it into its own outer loop only if it ever needs a
different cadence (e.g. strategy review every 5 versions instead of every 1).

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
       CHANGELOG.md
       QA.md
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
