# trsl — agent onboarding

## Project overview
`trsl` is a Next.js app (under `app-trsl/`) that helps people soften raw
messages before sending them. The sender writes something unfiltered; the
app rewrites it via an LLM into a kinder but honest version; the sender
shares a link (`/m/<id>`); the receiver can tap a mock $1 unlock to reveal
the original. Live at https://trsl.vercel.app.

## Directory map

| Path | What it is |
|------|------------|
| `app-trsl/` | Next.js 15 app. All runtime code, env vars, Vercel config. |
| `app-trsl/src/app/page.tsx` | Composer: textarea + tone chips + context input. |
| `app-trsl/src/app/m/[id]/` | Share/receiver page + `ShareView.tsx` paywall. |
| `app-trsl/src/app/api/translate/route.ts` | Translation endpoint. |
| `app-trsl/src/app/api/reveal/[id]/route.ts` | Reveal-original endpoint. |
| `app-trsl/src/lib/translate.ts` | LLM call + DECLINE guardrail. |
| `app-trsl/src/lib/share.ts` | AES-256-GCM share-id encoding/decoding. |
| `app-trsl/src/lib/client-flags.ts` | localStorage sender/unlock flags (UI only). |
| `app-trsl/src/app/globals.css` | Animation keyframes for the three named motion moments. |
| `agents/` | Persona instructions: `pm`, `product-designer`, `critic`, `engineer`, `qa`, `release-manager`, `reviewer`, plus `BRAND.md` and `TASTE.md`. |
| `loop/LOOP.md` | The canonical product lifecycle loop. Read this before doing any versioned work. |
| `.claude/commands/trsl-loop.md` | Claude-specific invocation wrapper for `loop/LOOP.md`. Read this too if you are Claude. |
| `state/` | Backlog, ROADMAP, and versioned artifacts. |
| `state/backlog.md` | Running candidates + "Shipped" log. |
| `state/ROADMAP.md` | Vision, phases, north star. |
| `state/versions/vN/` | Per-version artifacts: PRIORITY.md, DESIGN.md, DISCUSSION.md, FINAL.md, CHANGELOG.md, QA.md, DEMO.md, RELEASE.md, RETRO.md. |

## How to run a version iteration
1. Read `loop/LOOP.md` and `.claude/commands/trsl-loop.md` (if Claude). The
   loop is: pm → product-designer (draft) → critic → product-designer
   (finalize) → engineer → qa → **demo round** → release-manager → reviewer.
2. Determine `vN` from `state/versions/` (`N = max existing + 1`).
3. Spawn one subagent per stage with its `agents/<persona>/AGENT.md`
   instructions, the repo root path, and the input files `loop/LOOP.md`
   specifies.
4. **Demo round is a hard gate**: deploy a **preview** (`vercel deploy`, no
   `--prod`), then spawn pm + product-designer + critic to evaluate it and
   append rounds to `state/versions/vN/DEMO.md`. PM's verdict blocks or
   clears release. Do **not** deploy to production before demo.
5. Only after pm demos `ship` do you run release-manager, tag, and deploy
   production (`vercel --prod`).

## Deployment
- Preview: run `vercel deploy --yes` from **repo root** (`/Users/taeahn/devs/personal/2026/trsl`), not `app-trsl/`. The Vercel project has `app-trsl` as its Root Directory.
- Production: `vercel --prod --yes` from repo root.
- Project: `trsl` under `team_awSPTI6P1xA1HepFByFtOyg`.

## Env vars (production)
`OPENAI_API_KEY` and `SHARE_SECRET` are required in production. They live in
`app-trsl/.env.local` locally; production values are in Vercel project
settings.

## Current version
Check `state/versions/` for the highest-numbered directory and read its
`RELEASE.md` for what shipped last. The shipped log in `state/backlog.md`
also has a one-line summary per version.
