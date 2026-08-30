# v2 Discussion

## Objections

### 1. The paywall doesn't exist. It's a picture of a paywall. — BLOCKER
The risk: `original` ships to the browser in the initial HTML/JSON payload
of every `/m/[id]` load, paywall or no paywall. "Unlock" just toggles a
CSS blur off. That means the $1 ask isn't guarding anything — the raw text
is already sitting on the wife's device the second the page loads. She
doesn't need to pay, she doesn't even need to tap unlock, she doesn't need
devtools. She pastes the URL into any base64 decoder, or just reads the
network response, and she has it for free. This isn't a hardening gap you
shrug off for a mock — it's the product. The entire pitch of this
iteration is "pay to see what he really said." If seeing it never actually
required paying, you haven't built a paywall to test, you've built a
share-link generator with a decorative button bolted on. You can't
pressure-test "will she pay $1" when the honest answer is "she never had
to."

The designer's own framing — "she'd have to deliberately go looking" — is
wrong on the facts. Going looking means opening devtools. This doesn't. A
base64 payload in a URL is one paste into a browser bar away from plain
text. That's not a technical nitpick, that's the difference between "mock
payment flow" and "no payment flow, plus theater."

There's a second layer here that makes it worse than a broken feature:
this text is not the softened, house-approved message v1 always shared —
it's the "super straight from your gut, unfiltered" original the README
promises. That's the one input this whole app is built to handle
carefully. v1 only ever put the *translated* version in a link that gets
forwarded into iMessage, WhatsApp, Instagram DMs. v2 puts the raw one
there too, readable by anyone who opens the link, forwards it, or has it
sitting in their chat history — with a fake lock icon over it that tells
the *sender* their unfiltered words are gated and the *wife* they're worth
paying for. Neither of those things is true. If that raw text is ever
actually harsh — which is the whole premise, "say something you can't say
directly" — you've now put unfiltered, potentially ugly language about a
specific person into a link with no real gate on who reads it, and you've
told both people in the exchange something false about how protected it
is.

**Fix**: the designer already named it and talked herself out of it in
open question 2 — do it. `decodeShareId` returns `translated` to the page;
`original` stays server-side until a real request asks for it. Add the
trivial `/api/reveal/[id]` route she already sketched: re-decode, re-verify
the signature, return `o`. The client calls it on unlock tap (or on load
for the sender-detected case). This is not new plumbing, it's the same
decode function behind one more route. It also happens to fully answer the
T&S concern above for free — if `original` never leaves the server pre-
unlock, it's never sitting in a forwarded link either. One fix, two
objections closed.

### 2. localStorage "ownership" is a second way to skip the register — real, but not a blocker on its own
Spoofing or losing the sender flag (private window, cleared storage,
second device) has two failure directions and they're not symmetric. A
legit sender seeing their own paywall is annoying, not harmful — that's a
UX miss you fix later. A receiver (or anyone) manually setting the
localStorage flag to read the original for free is the same failure mode
as objection 1, just requiring one devtools line instead of zero. Once
`/api/reveal/[id]` is the actual gate, this stops being a data leak and
becomes purely a "who sees the button vs. the reveal" UI question — worth
a follow-up (e.g. don't let the client-side flag alone authorize the
reveal call; that's a two-minute addition once the route exists), but not
worth blocking this round over. Ship the fix in objection 1 and this
downgrades to a nice-to-have.

### Non-objections, since the designer asked directly
- Open question 3 (unlock doesn't survive a device switch): fine for a
  mock. She pays, it stays unlocked on the phone she paid on. That's a
  legible enough result to read from a phase-2 test — it's not the thing
  you're testing.
- Open question 4 (in-place vs. alongside layout post-unlock): genuinely
  an execution detail, engineer's call stands.
- The wife/husband tone questions from the persona brief: nothing new in
  this iteration's *feature* changes the manipulative-or-useful read from
  v1 — that argument was had already. What v2 changes is exposure surface
  (raw text now travels in a link), which is objection 1, not a new tone
  problem.

## Verdict
**revise**

Objection 1 is the blocker: as specced, the $1 paywall is fake in a way
that also lets the app's rawest content leak into forwardable links with a
false "this is protected" label on it. The fix is small — a server-side
reveal endpoint instead of shipping `original` in the initial payload —
and the designer already wrote the fix in her own open question, she just
under-weighted it. Make that not-optional, fold in the note on objection
2, and this is buildable as one increment.
