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
5.5. demo                     -> preview deploy + state/versions/vN/DEMO.md
   - if hold: back to step 3 (product-designer, finalize), once. Still held
     after that -> release-manager proceeds anyway, but the dissent ships
     unresolved into RELEASE.md and reviewer's next retro, instead of
     blocking indefinitely.
6. release-manager            -> state/versions/vN/RELEASE.md, version bump, tag
7. reviewer                   -> state/versions/vN/RETRO.md, backlog.md update,
                                  possible edits to agents/*/AGENT.md and this file
```

### 5.5. Demo round

Everything before this point only ever showed pm and product-designer the
*spec* (PRIORITY/DESIGN/FINAL) — never the actual built thing, until it was
already live. Demo closes that gap: once QA verdicts `ship`, deploy a
**preview** (not production — `vercel deploy` without `--prod`, same project,
throwaway URL) and have the three taste-holders — **pm, product-designer,
critic** — actually use it, for real, the way a receiver/sender would.
Engineer and QA don't re-run here; their job (does it work, does it match
FINAL.md) is already done. This stage is purely "does the finished thing
still earn the taste bar we set," using each persona's own `## Taste`
section as the lens.

Each of the three spends a short pass on the live preview (use `browser-use`
for anything interactive, per `agents/qa/AGENT.md`'s pattern) and appends a
section to `state/versions/vN/DEMO.md`: a gut reaction from their taste, and
a verdict — `ship` or `hold` (hold = something about the *finished* thing,
not the spec, doesn't sit right; name it concretely, same discipline as
critic's DISCUSSION.md objections).

If any of the three holds: one round back to product-designer (finalize) to
adjust FINAL.md/scope in response — capped at one round, same shape as
critic's normal one-round rule, so this can't loop indefinitely. If the
adjustment requires more than a small tweak, that's a signal PRIORITY.md
itself was wrong, not something to force through mid-iteration — release
this version as-is and let PM re-scope next iteration instead.

If still held after the one round: don't block release. Ship it, but the
unresolved dissent from DEMO.md carries into RELEASE.md's summary and is
required reading for reviewer's step 7 retro — a taste disagreement that
survives a full round is itself worth root-causing (did PRIORITY.md scope
the wrong thing? did FINAL.md lock a detail no one actually liked?), not
something to quietly ship past.

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
