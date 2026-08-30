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

4. If qa verdict is `ship`: run the demo round (loop/LOOP.md 5.5) before
   release-manager. Deploy a **preview**, not production (`vercel deploy`
   from repo root, no `--prod` flag). Spawn pm, product-designer, and critic
   in parallel against that preview URL, each appending a new dated round to
   `state/versions/vN/DEMO.md` per their "Demo round" persona section — tell
   each one the preview URL and to use `browser-use` for anything
   interactive. This is round 1.

5. Resolve holds — pm's verdict is the one that matters for whether you loop:
   - If **only** critic and/or product-designer held (pm shipped): spawn
     product-designer's "Demo response" pass once, then move on regardless
     of outcome — this advisory path is capped at one round.
   - If **pm** held: read which stage pm said to go back to (engineer,
     product-designer/finalize, or pm's own PRIORITY.md) and re-run the
     normal forward path from there back through qa and into another demo
     round (round 2). This can repeat — there is no fixed cap on pm's holds
     specifically.
   - **Circuit breaker**: after demo round 3 without a pm `ship`, stop the
     iteration entirely — do not run release-manager, do not force a ship.
     Report to the user: the full DEMO.md history (all rounds, every
     persona's reasoning, not just the last), and ask them how to proceed.
     This is the one case in the whole loop where you stop and wait for the
     user instead of continuing autonomously.

6. Once pm's latest demo round verdict is `ship` (and QA's is still `ship` —
   re-confirm if any backward loop touched code): spawn release-manager,
   then reviewer.

7. If any critic/product-designer demo hold stayed unresolved after its one
   advisory round, make sure release-manager's RELEASE.md summary and
   reviewer's RETRO.md both surface it — a live signal for reviewer's
   root-cause pass, not something to let quietly disappear into a shipped
   version.

8. After reviewer finishes, report to the user: what shipped (from
   RELEASE.md), any unresolved demo dissent, how many demo rounds it took,
   and any process changes the reviewer made (from RETRO.md's "Process
   changes" section) — reviewer edits to `agents/*/AGENT.md` or
   `loop/LOOP.md` apply starting next iteration.

If invoked as `/trsl-loop step=N`, skip straight to running only that single
stage against existing state files instead of a full iteration — for manual
intervention.
