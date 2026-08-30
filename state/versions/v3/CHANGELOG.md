# v3 Changelog

Optional tone-preset chips + optional context input on the composer.
`translate()` gained two optional params; nothing else about the pipeline
changed.

## Files touched
- `app-trsl/src/app/page.tsx` — chip row, context input, wired into POST body.
- `app-trsl/src/lib/translate.ts` — `Tone` type, `TONE_PROMPTS`,
  `buildSystemPrompt()`, `MAX_CONTEXT_CHARS` export, context appended to the
  user-role message.
- `app-trsl/src/app/api/translate/route.ts` — server-side `context` length
  validation (mirrors existing `MAX_CHARS` check) and a server-side tone
  whitelist.
- `app-trsl/src/app/globals.css` — one `input::placeholder` rule so the new
  context input hits BRAND.md's `#888` exactly (scoped to `<input>` only,
  the existing `<textarea>` placeholder is untouched).
- `agents/BRAND.md` — already carried the Chips entry going into this pass;
  no further change needed there.

## Acceptance criteria (FINAL.md)

1. **Empty state byte-identical to pre-v3** — PASS. Verified by logging the
   actual `messages` array sent to OpenAI with both fields empty: system
   prompt matched `SYSTEM_PROMPT` verbatim (including its two trailing
   spaces), user message was `raw` unchanged. Confirmed `context: undefined,
   tone: undefined` are omitted from the JSON body (`|| undefined` in
   `page.tsx`).
2. **Tone chip → system prompt gets the guidance clause** — PASS. Live call
   with `tone: "boundary"` produced system content equal to
   `SYSTEM_PROMPT + "\n\nTone the sender wants: " + TONE_PROMPTS.boundary`,
   captured verbatim from the real request.
3. **Context → appended to user message only** — PASS. Live call with
   context produced user content equal to
   `raw + "\n\n[context: " + context + "]"`; system prompt was unaffected.
4. **200-char cap, client + server** — PASS both sides. Client: typed 250
   chars into the context `<input maxlength=200>` via browser-use, DOM value
   landed at exactly 200. Server: direct POST with a 201-char context
   (bypassing the client) returned 400 `"Context is too long (max 200
   characters)."` *before* `translate()`/OpenAI was ever called.
5. **Chip single-select** — PASS. Selecting a second chip deselected the
   first (verified via computed `background-color` on both). Re-clicking a
   selected chip deselected it back to transparent.
6. **Share payload unaffected by context** — PASS. `encodeShareId` call site
   in `route.ts` is untouched — still `encodeShareId(result.translated,
   text)`, `context` never passed. Live-verified: sent a message with
   context set, fetched the resulting `/m/[id]` page, confirmed the context
   string does not appear anywhere in the response and the translated text
   renders correctly (AES-GCM uses a random IV per encode, so comparing raw
   id strings isn't a valid diff — the call-site/payload-shape check is).
7. **Button enabled state unaffected by chip/context** — PASS. With the main
   textarea empty, selected a tone chip and filled the context input;
   Translate stayed disabled.
8. **DECLINE covers context-only abuse** — PASS. POST with a benign `text`
   ("we need to talk tonight") and a self-harm-flagged `context` returned
   `{"declined": true}` — confirms the append-into-user-message wiring (not
   just the raw-message path) is what the guardrail sentence catches, since
   there was nothing to catch in `raw` alone.
9. **Keyboard focus + operability** — PASS. Tab order: textarea → 5 chips →
   context input → Translate, each with `outline-style: auto` (browser
   default, not suppressed by any reset). A focused chip toggled on `Enter`
   and back off on `Space`.
10. **Chip visual states match BRAND.md exactly** — PASS. Unselected:
    `background: transparent`, `color: rgb(238,238,238)` (#eee), `border:
    1px solid rgb(79,70,229)` (#4f46e5). Selected: `background:
    rgb(79,70,229)`, `color: rgb(255,255,255)`. No shadow, no transition
    (instant state swap, per BRAND.md's Chips entry). Note: the selected
    chip keeps its `1px solid #4f46e5` border rather than dropping to
    `border: none` like the full-width primary button — intentional, since
    removing the border would shift the chip's box size by 2px on toggle,
    which would read as motion. Not a deviation from BRAND.md, just a
    scale-appropriate reading of "primary-button treatment."

## Notes
- Route validates `tone` against a closed 5-value whitelist server-side
  (not spelled out verbatim in FINAL.md's route.ts snippet, but required to
  make FINAL.md's "closed enum ... no injection surface" claim about tone
  actually hold — an arbitrary client-supplied tone string never reaches
  the system prompt). Verified: `tone: "<script>evil</script>"` produced a
  normal untoned translation, no error, no injection.
- Local verification required launching `npm run dev` with the sandbox's
  outbound network restriction lifted for that one background process —
  otherwise the OpenAI call fails with a generic "Connection error." No
  code change involved; noted here only because it's the reason live
  verification needed a relaunch mid-session.
