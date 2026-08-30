# Evaluating three community design skills, before wiring one in

Source skills dissected (full content pulled from their source repos, not
just the skills.sh listing pages):
- `refoundai/lenny-skills` → **retention-engagement** (skills.sh listed this
  as "behavioral-product-design"; the repo has no folder by that name —
  `retention-engagement` is the actual match, confirmed by the same Jackson
  Shuttleworth loss-aversion quote skills.sh's page previewed)
- `borghei/claude-skills` → `product-team/product-designer`
- `buildgreatproducts/builder-os` → `skills/design-system`

## Success criteria (written before evaluating)

A skill earns a place in this repo only if it clears all of these — not "is
generally good design advice":

1. **Fits the loop, not a generic agent.** Must slot into an existing
   persona's actual `Input -> Output` (product-designer's DESIGN.md/FINAL.md,
   critic's DISCUSSION.md, or the demo round) — not a standalone tool nobody
   in `loop/LOOP.md` ever invokes.
2. **No dependency we don't have.** trsl has no Figma file, no user-testing
   panel, no analytics pipeline, no design tool integrations. A skill that
   assumes any of those is dead weight until we actually have them.
3. **Ponytail-sized.** The smallest wiring that changes what product-designer
   actually outputs. No Python toolchains, no multi-file scaffolding, no
   "reference materials" folder nobody will maintain — YAGNI applies to
   skills same as code.
4. **Doesn't duplicate what already exists.** `agents/BRAND.md` already is
   a token system; `agents/TASTE.md` already is a taste framework. A skill
   that reinvents either instead of extending it fails this test.
5. **Produces something testable.** In keeping with how every other stage
   works (FINAL.md's acceptance criteria, QA's pass/fail table) — a skill
   that only produces vibes/prose with no way for critic or QA to check
   compliance isn't pulling its weight.
6. **Grounded, not just structured.** Prefer principles with a stated
   mechanism ("why this works") over templates with no reasoning — trsl's
   whole taste system (Nolan, NewJeans, Kael, TPS, Gawande, Allspaw) is
   deliberately reasoned, not just formatted.

## Evaluation

| # | retention-engagement | product-designer (borghei) | design-system (builder-os) |
|---|---|---|---|
| 1. Fits the loop | Partial — no artifact format, just "principles + questions to ask." Would need translating into a PRIORITY.md/DESIGN.md lens. | Partial — assumes a 5-stage discover/define/develop/test/deliver process trsl doesn't run (no user research phase, no dedicated usability-test stage exists in our loop). | Good — a token-derivation workflow maps almost directly onto what BRAND.md already is; would extend, not replace, our loop. |
| 2. No missing dependency | **Pass** — pure reasoning, no tooling assumed. | **Fail** — assumes Figma, a usability-test panel (5-8 real participants), SUS scoring, card-sorting sessions. We have none of this at trsl's stage. | Partial — assumes source imagery (screenshot/Figma/mockup) to translate *from*. trsl's BRAND.md was authored directly, not derived from an image; the image-intake workflow doesn't apply as-is. |
| 3. Ponytail-sized | **Pass** — a handful of principles + questions, easy to trim to what's relevant. | **Fail** — full Python toolchain (`design_critique.py`, `journey_mapper.py`, `usability_scorer.py`), a 5-day sprint calendar, external tool integrations (Maze, Dovetail, Jira). Enormous relative to a two-page indie app. | Mostly pass — the *methodology* (Steps 1-4: analyze → clarify → derive tokens → write prose) is lean; the two-file-mirror mechanic (`.md` + `.html`) is more ceremony than trsl needs right now, but the token schema itself is simple. |
| 4. Doesn't duplicate | Pass — nothing like this exists in trsl's personas yet; behavioral principles are a genuine gap (no persona currently asks "does this feature exploit or ignore a real psychological mechanism"). | Partial — the "Design Principles" (hierarchy, consistency, feedback, accessibility) and accessibility checklist are a real gap (BRAND.md has *values*, not a compliance checklist); the journey-mapping/IA/sprint material duplicates nothing because trsl doesn't need it yet. | **Fail on the workflow, pass on the schema** — BRAND.md already *is* our design.md; re-running the full image-intake ceremony would fork a second source of truth. The YAML token schema itself (semantic names, `{path.to.token}` references, states-as-separate-entries) is a genuine improvement over BRAND.md's current prose-only format. |
| 5. Testable | Partial — "questions to help users" and "common mistakes to flag" are checkable, but nothing scores pass/fail the way QA.md's table does. | **Pass**, where in scope — accessibility checklist (4.5:1 contrast, focus indicators) and Nielsen's 10 heuristics are genuinely checkable by critic without new tooling; SUS/task-completion require real users we don't have yet, so out of scope for now. | Pass for tokens (a component either references a BRAND.md token or it's a violation — binary), no claim beyond that. |
| 6. Grounded | **Pass, strongest of the three** — every principle is a named person + a stated causal mechanism (why loss aversion works, why day-7 is the retention inflection point), same texture as trsl's existing TASTE.md. | Partial — Nielsen's heuristics and WCAG numbers are grounded; the 5-day sprint/journey-map templates are process scaffolding, not reasoned principles. | Weak on "why" beyond "match the reference image" — it's a derivation *method*, not a set of principles with mechanisms. Appropriate to its actual job (extracting tokens from an image), just not a source of grounded taste. |

## Verdict

None of the three gets adopted wholesale — each earns a *narrow, specific*
extraction:

- **retention-engagement → new lens for pm's Demo round and DESIGN.md's
  acceptance criteria**: does this increment leverage or ignore a real
  behavioral mechanism (loss aversion, friction at first use, mounting
  value)? This is a genuine gap — PM currently checks "does this advance the
  roadmap phase," never "does this actually change user behavior and why."
- **product-designer (borghei) → two extractions only**: the "Clarify First"
  stop-rule discipline (ask only the 2-3 questions that most change the
  output, then proceed) is worth adding to how designer/critic operate; the
  accessibility checklist (contrast, focus, feedback-on-action) is worth
  adding to `agents/BRAND.md` and critic's demo-round check, since it's the
  one part of the skill genuinely testable without infrastructure we lack.
  Everything else (Python scripts, SUS scoring, journey maps, design
  sprints, Figma/Maze/Dovetail integrations) is out — no dependency, no
  current use.
- **design-system (builder-os) → token schema discipline only**: adopt the
  semantic-naming and `{token.reference}` convention for BRAND.md's palette
  (already close to this) and formalize "one source of truth, everything
  else must reference it, never restate a raw value" as an explicit rule —
  BRAND.md already mostly does this, this just makes it a named discipline
  future edits are held to. The image-intake workflow and dual-file
  `.md`/`.html` mirror mechanic are not adopted — no image source exists,
  and a second generated file to keep in sync is exactly the kind of
  ceremony ponytail says to skip until it earns its keep.

See `.claude/skills/product-taste/SKILL.md` for the resulting wired skill.
