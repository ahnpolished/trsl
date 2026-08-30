---
description: Run one iteration of the trsl product lifecycle loop (design -> discuss -> finalize -> build -> QA -> release -> review/evolve)
---

Run one full iteration of the loop defined in `loop/LOOP.md`. Follow it
exactly — read it first if you haven't this session.

Steps:

1. Determine `vN`: look at `state/versions/`, take the highest existing
   `vK`, use `N = K + 1` (or `1` if none exist). `mkdir -p state/versions/vN`.

2. For each stage in `loop/LOOP.md`, spawn **one real subagent per stage**
   using the Agent tool (`subagent_type: general-purpose`, no isolation —
   they must share this working tree). Build each subagent's prompt as:
   the full contents of `agents/<persona>/AGENT.md`, plus the repo root path,
   plus the current version number `vN`, plus which input file(s) to read per
   `loop/LOOP.md`. Tell it exactly which output file(s) to write and where.

3. Run stages in order: pm -> product-designer (draft) -> critic ->
   product-designer (finalize) -> engineer -> qa. If qa's verdict in QA.md is
   `block`, spawn engineer once more against the same FINAL.md + QA.md, then
   qa once more. If still `block`, stop here and report the blockage instead
   of continuing to release.

4. If qa verdict is `ship`: spawn release-manager, then reviewer.

5. After reviewer finishes, report to the user: what shipped (from
   RELEASE.md), and any process changes the reviewer made (from RETRO.md's
   "Process changes" section) — reviewer edits to `agents/*/AGENT.md` or
   `loop/LOOP.md` apply starting next iteration.

If invoked as `/trsl-loop step=N`, skip straight to running only that single
stage against existing state files instead of a full iteration — for manual
intervention.
