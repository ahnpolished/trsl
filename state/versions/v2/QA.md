# v2 QA

Verified against a running instance (`npm run dev`, port 3001, real
`OPENAI_API_KEY`/`SHARE_SECRET` from `app-trsl/.env.local`) via direct
`fetch`/`node` HTTP calls and a real headless Chrome (Playwright, system
Chrome channel) driving actual translate → share → unlock flows. Not
mocked; OpenAI was called for real on every translate test below.

## Criteria

| # | Criterion | Result |
|---|---|---|
| 1 | Result text animates in on `/` after translate | **Pass** — `.trsl-result-enter` class present on result block (blur/fade-up keyframes in `globals.css`), verified in a real browser after a real (non-English) translate call. |
| 2 | Non-generating device sees locked state + "Unlock the original — $1", no original before tap | **Pass** — fresh browser context, no localStorage: locked view rendered, `bodyText` did not contain original text pre-tap. |
| 3 | `/m/[id]` initial response does not contain original text anywhere in markup/JSON/inline script; retrievable only via `/api/reveal/[id]` | **FAIL — see Bug #1.** Plaintext-grep of the HTML shows no bare original string, but the route param `id` — which is the full base64url `{t,o}` payload plus signature — is passed as a prop to `<ShareView id={id} …>` and gets serialized verbatim into the page's inline RSC flight script (`self.__next_f.push(...)`). `original` is one `atob()` of a substring already present in the raw HTML — no reveal call needed. |
| 4 | Unlock tap: distinct non-instant processing state (~1s), calls `/api/reveal/[id]`, cross-fade to original with "originally:" note, never before response is in hand | **Pass** — measured live: button shows "Unlocking…" and is disabled through ~700ms, original text still absent from DOM at that point; original + "originally: ..." note present by ~1.35s (matches Promise.all(fetch, 1000ms timer) gating in `ShareView.tsx`). |
| 5 | Reload after unlock shows original already unlocked, no re-paywall, reveal endpoint re-called each load (not cached) | **Pass for the reveal-refetch behavior** — verified `UNLOCKED_IDS_KEY` flag causes auto-reveal via `/api/reveal/[id]` on load, no paywall shown. **Same root cause as Bug #1 undermines the "never cached client-side in a way that would require storing it before the paywall" clause** — the id itself (stored in `UNLOCKED_IDS_KEY`/`SENT_IDS_KEY`) already contains `o` before any paywall interaction. |
| 6 | Sender's own fresh link auto-reveals, no paywall | **Pass** — `SENT_IDS_KEY` set before visit → original shown directly, no unlock button rendered. |
| 7 | Tampered/forged ids 404 on both `/m/[id]` and `/api/reveal/[id]` | **Pass** — tested tampered signature, tampered payload (valid sig, edited payload byte), and garbage string on both routes; all four combinations 404. |
| 8 | Share button shows distinct copy-confirmation animation | **Pass** — `.trsl-copied-pulse` (scale-pulse) class applied on "Copied!" state, confirmed in real browser with `navigator.share` disabled to force the clipboard path (see note below). |
| 9 | No new backend/DB/payment SDK; only `/api/translate` + `/api/reveal/[id]` | **Pass** — `package.json` has no `stripe` or other new deps beyond v1's `openai`; `npm run build` output lists exactly `/api/translate` and `/api/reveal/[id]` as the only API routes. |
| 10 | v1 criteria still hold (guardrail, char limit, OG tags, noindex, anonymous usage) | **Pass** — DECLINE guardrail fires on threat/self-harm content, char limit (1000) rejects with 400, empty input rejects with 400, malformed JSON returns 400, `noindex`/`og:title` present on `/m/[id]`. |

**9/10 pass, 1 fail (P0).**

## Bugs

### Bug #1 — P0 — Original text ships in `/m/[id]`'s initial payload via the route id itself

**FINAL.md criterion 3 (bolded, called "not optional") and Resolved #2 both
require that the original never leaves the server before an explicit
reveal call, and that "the link itself no longer carries the original
anywhere."** It does.

`encodeShareId` (`app-trsl/src/lib/share.ts`) base64url-encodes
`{t: translated, o: original}` and returns `<payload>.<sig>` as the id.
`app-trsl/src/app/m/[id]/page.tsx` passes that full `id` string as a prop
to the client component `<ShareView id={id} translated={message.t} />`.
Next.js serializes client-component props into the page's inline RSC
flight script (`self.__next_f.push(...)`) in the initial HTML response —
so the id (and therefore `o`) is present in the raw, unauthenticated
initial response.

Reproduction:
```
node -e 'const id="<a real /m/[id] id>";
console.log(Buffer.from(id.split(".")[0],"base64url").toString())'
# -> {"t":"...","o":"<the real original text>"}

# and the id itself is present in the page's raw HTML:
curl http://localhost:3001/m/<id> | grep -o '<first 40 chars of payload>'
# -> matches, inside self.__next_f.push(...)
```
No devtools localStorage edit, no `/api/reveal/[id]` call, no unlock tap
required — anyone with the link can view-source and read the original
with one `atob()`. This defeats the entire premise of the mock paywall as
specified.

**Design defect, not just an engineering miss** (noting per AGENT.md):
FINAL.md's own Scope section requires the client to receive "the id
itself" so it can call reveal later, while Resolved #2 asserts the link
carries no original — these two requirements are mutually exclusive as
long as the id *is* the signed `{t,o}` payload. A criterion the design
can't satisfy is a spec defect; the fix (e.g., a short opaque reference
plus a store, or dropping `o` from the id and having `/api/reveal/[id]`
look it up some other way) is the engineer's call, not QA's to prescribe.

**Fix direction (not prescriptive):** the id passed to the client and used
in the URL must not itself carry `o`. Either the id embeds only `t` (and
`/api/reveal/[id]` needs a separate mechanism to find `o` — a server-side
store keyed by id, since a stateless signed id can't hide a field it
contains), or reveal needs a different id shape entirely. This changes the
"no database" design principle in `share.ts`'s own comments, so it's a
real architectural call, not a one-line patch.

### Note — not a bug, verified as environment noise
`navigator.share` exists in headless Chrome under Playwright but hangs
indefinitely with no user gesture completion in that environment, so the
button never shows "Copied!" when `navigator.share` runs. Confirmed by
disabling `navigator.share` to force the `clipboard.writeText` fallback
path used by any desktop browser without a native share sheet — the
copy-confirmation animation works correctly. Do not re-open this as a
bug; it's a headless-automation artifact, not app behavior.

### P2 — backlog, not blocking
`ShareView`'s initial `phase: "checking"` state (before the mount
`useEffect` reads localStorage) renders translated-only, no unlock
button, for one paint. Degrades safe (no original leak, no plaintext
exposure) — just a one-frame flash before the locked/revealed UI settles.
Not worth blocking on.

## Design-defect note for FINAL.md (per AGENT.md, not a code bug)
Criterion 3's guarantee and the Scope section's "id itself" mechanism are
in direct tension (see Bug #1). Future FINAL.md revisions for this feature
should specify what the id is allowed to contain, not just what the
initial *props/JSON the page explicitly renders* contain — "the id" is
part of that payload once it's handed to a client component.

## Verdict

**Block.** One open P0 (Bug #1) — the mock paywall's core guarantee
(original absent from the initial page load) does not hold; it's
recoverable from view-source without any interaction. Hand back to
engineer per AGENT.md's one-round policy.

## Housekeeping note
An `npm run build` run during this QA pass overwrote the `.next` output
of the already-running dev server (PID 60104 on :3001), causing it to
500. Killed that process and restarted `npm run dev -p 3001` cleanly
(background task) before continuing — app was verified healthy
(200 on `/`) afterward and all tests above ran against the restarted
instance. No app code was touched.
