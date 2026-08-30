# v3 Retro

## What worked

- **Critic's blockers were real, small, and accepted.** Both DISCUSSION.md
  objections (DECLINE guardrail bypass via `context` in the system prompt,
  client-only 200-char cap) were concrete security gaps. The designer
  folded both into FINAL.md without rejected objections, and the engineer's
  implementation matched the locked design almost verbatim.
- **The abuse-surface fix was the smaller of the two available moves.**
  Appending `context` to the user-role message alongside `raw` closed the
  guardrail gap without a separate DECLINE scan or a system-prompt rewrite.
  QA confirmed it works by declining a threat placed in `context` alone
  with a benign `raw`.
- **QA tested outside the changelog's claims.** Browser-use for chip
  selection/focus, direct `fetch()` POSTs to bypass client validation,
  forged-id 404 checks, and a tone-whitelist bypass probe all ran
  independently. No criterion was taken on the engineer's word alone.
- **Tone presets actually changed output character.** QA's extra product-
  taste check showed the same raw message produced meaningfully different
  translations under gentle / honest / boundary / playful, confirming the
  feature wasn't a cosmetic template swap.
- **The v2 URL-exposure check did its job.** Critic's non-issue note in
  v3 DISCUSSION.md explicitly verified that `encodeShareId(result.translated,
  text)` is unchanged and `context` cannot reach the `/m/[id]` payload.
  No new link-exposure confidentiality gap appeared this iteration.

## What didn't

### 1. Production was deployed before the demo round completed

**Symptom:** PM's Round 1 in DEMO.md held because the production URL
(`https://trsl.vercel.app`) was already live and redirecting a clean
browser session to a Vercel authentication gate. The feature code was
correct, but a real recipient could not have used the deployed artifact
at that moment.

**Root cause:** The release-manager gate that requires PM's `ship` verdict
before production deploy was bypassed. LOOP.md states that release-manager
must confirm "pm's latest demo round verdict is `ship`" and that the loop
"will deploy previews only until PM demos `ship`," but there is no
mechanical enforcement of that ordering — nothing in LOOP.md or any
persona's AGENT.md says what happens if a production deploy happens
before PM has signed off. In that vacuum, the deploy went out and PM's
demo round became a post-deploy check instead of a pre-ship gate.

**Cost:** one full demo round spent discovering and diagnosing an
accessibility problem that should have been caught by a preview-only
deploy policy, plus the risk that a broken public URL sat live while the
loop was still evaluating the build.

**Not root cause:** "PM held on a Vercel config issue." The config issue
was real and worth fixing, but it only mattered because production was
already exposed. If the loop had stayed on a throwaway preview until PM
shipped, the gate would have held cleanly.

### 2. The preview URL was behind Vercel team authentication

**Symptom:** The first preview URL supplied to the demo round redirected
a clean browser session to a Vercel login page, so PM/product-designer/
critic could not exercise the built feature until they switched to the
production alias.

**Root cause:** The deployed preview had Vercel Deployment Protection /
team authentication enabled. That setting is project/configuration-level,
not code-level, and it conflicts with the demo round's requirement that
the preview be reachable from a clean browser session. Nobody checked
reachability from an anonymous session before declaring the deploy ready
for demo.

**Cost:** Round 1 of DEMO.md was consumed by access debugging rather than
product evaluation, compounding the cost of the premature production
deploy.

## Is this a repeat, or a new failure class?

**New — both are first occurrences in this form, so the 2+-iteration bar
for editing `agents/*/AGENT.md` or `loop/LOOP.md` does not fire.**

- v1's deploy problem was "no deploy target / no live API key" (QA
  criteria 8 & 10 blocked on sandbox limits), not "production deployed
  before PM signed off."
- v2 shipped after QA-2 re-verification with no mention of a premature
  production deploy or an auth-gated preview.
- The underlying failure class here is a **release-gate ordering / preview-
  readiness check** that the loop currently assumes but does not enforce.

No `agents/*/AGENT.md` or `loop/LOOP.md` edits this cycle. Both items are
logged as watch items below so a future retro can check whether they recur
before promoting them to process changes.

## Watch items (not process changes yet)

1. **Production deploy before PM demo `ship`.** If this happens in a
   second iteration, the fix is a narrow addition to `loop/LOOP.md` and/or
   `agents/release-manager/AGENT.md`: a production deploy action (`vercel
   --prod` or equivalent) must not run until the latest `state/versions/vN/
   DEMO.md` contains a PM `ship` verdict. Previews are the only allowed
   artifact for the demo round.

2. **Preview URL reachable from a clean browser session.** If the auth-
   gated preview recurs, add a pre-demo readiness check (engineer or
   release-manager runs an anonymous `curl -L` / browser-use session
   against the preview URL) before handing the URL to the demo round.

3. **Rate limiting / cost control on `/api/translate`.** Already open
   since v1, but v3's optional `context` field increases per-call token
   spend and gives an unauthenticated endpoint a longer user-controlled
   prompt. Worth treating as a higher-priority backlog item than before.

4. **Qualitative-only quality measurement for context/tone.** v3 judged
   translation quality by hand on a handful of examples. If real usage
   grows, a lightweight automated eval harness (even a small golden-set
   regression) will become worthwhile so prompt tweaks don't silently
   regress the output bar.

5. **Context cap usage signal.** 200 chars was the designer/engineer call
   this iteration and it covered the user-story examples. If senders
   consistently hit the ceiling, that's the real signal for widening it —
   not a hypothetical.

## Process changes

None this cycle. No failure class recurs across 2+ RETRO.md files, per
`agents/reviewer/AGENT.md`.

## What should FINAL.md/RELEASE.md have done differently

FINAL.md itself was precise enough that QA's verification was mechanical
for 9 of 10 criteria; criterion 9's "visible native focus outlines" was a
little loose, but it did not cause a back-and-forth. The deploy-gate issue
is not a FINAL.md problem — it's a release-orchestration problem that
lives upstream of the spec.

RELEASE.md correctly named the premature-deploy issue in its "Process
note" and committed to "previews only until PM demos `ship`" going forward.
That note is the right artifact for surfacing the watch item; the next
retro should check whether that commitment held in practice.
