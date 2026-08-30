# DISCUSSION-2: post-QA-block P0 fix, retroactive crypto review

Reviewing commit `72fd2e6` (`fix(share): encrypt share id payload, not just sign it`)
against the standing loop watch-item: anything protecting user content or
deciding what unauthenticated input becomes a rendered public page gets a
critic pass. This one's overdue — it shipped post-QA-block, no critic pass
before merge. Doing it now.

## What changed

`app-trsl/src/lib/share.ts`: the `/m/[id]` share id used to be
`base64url(JSON.stringify({t,o})).<hmac-sig>` — encoding plus a tamper-detect
signature, not confidentiality. Since the id *is* the URL path segment, `o`
(the un-paywalled original) was plaintext-readable straight from the address
bar. That's the P0 QA caught.

Fix: the whole `{t,o}` payload is now AES-256-GCM encrypted as one blob
(`iv(12) || tag(16) || ciphertext`, base64url'd), key = `sha256(SHARE_SECRET)`.
The old separate HMAC is gone; GCM's own tag is the tamper/forgery check.

## The five questions

**1. `sha256(SHARE_SECRET)` as key derivation — sound, or does it need scrypt/HKDF?**

Fine as-is, and the "real risk vs theoretical" framing depends on an
assumption that's already true here: `SHARE_SECRET` is documented and
provisioned as a high-entropy random value (`.env.local` has a 32-byte
base64 value; README says "any long random string, e.g. `openssl rand`").
scrypt/Argon2 exist to slow down brute-forcing a *low-entropy, human-chosen*
secret (a password). SHARE_SECRET isn't that — it's already full-entropy
key material, so stretching it adds nothing. HKDF's value over plain SHA-256
is domain separation (deriving multiple independent keys from one secret,
or binding a context string) — there's exactly one key derived here, so
HKDF-Extract-then-Expand collapses to "hash it," which is what this does.
Not cutting a corner.

The actual risk isn't the derivation function, it's that nothing enforces
entropy on `SHARE_SECRET` — the README says "any long random string" but
`getSecret()` doesn't reject a short or guessable one. That's a pre-existing
condition, not new: v1's HMAC used the same secret the same way (as raw HMAC
key material, arguably a *lower* bar than "hashed into an AES key"). Not
introduced by this fix, not worth blocking on here. If it's ever worth
hardening, the fix is a length/entropy check in `getSecret()` on production
boot, not swapping the KDF.

**2. Dropping the separate HMAC for GCM's built-in tag — lose anything?**

No. GCM is an AEAD: the tag already authenticates exactly the ciphertext it
was computed over, which now covers `t` and `o` together (the changelog is
explicit that an earlier draft encrypted only `o` and left `t` as
unauthenticated plaintext — a real vuln, caught pre-commit: swap `t` on a
valid `o` ciphertext, still passes, renders attacker text under the trsl
brand — and fixed by encrypting the full JSON as one blob). A separate
HMAC over the same bytes an AEAD already authenticates is encrypt-then-MAC
redundancy with no independent failure mode it protects against, since both
depend on the same key material and the same "attacker doesn't have
SHARE_SECRET" assumption. Removing it is correct, not weakened — this is
standard practice and the stated reasoning holds up.

One structural note, not a defect: there's no format/version byte in the
blob (`iv||tag||ciphertext`, no discriminator). Fine for now since there's
only one format ever produced going forward, but if the encoding changes
again, decode has to distinguish formats by "did it parse," same trick this
fix already relies on for the old-format break (see #5). Cheap to add a
leading version byte pre-emptively; not worth doing reactively for a
one-shot migration that already works.

**3. IV/nonce handling — reused nonces?**

Read the actual code (`encodeShareId`, `share.ts:60-67`): `randomBytes(12)`
generated fresh on every call, no counter, no derivation from message
content, no reuse across calls. This is the correct pattern — random
96-bit GCM nonces from a CSPRNG, birthday-bound collision risk only becomes
material in the ballpark of 2^32 messages under one key, which this app is
nowhere near. No nonce-reuse risk, not even theoretical at this codebase's
scale. Confirmed by reading the code directly, not inferring from the
changelog's claims.

**4. Anything else about the implementation?**

- Auth tag length: `getAuthTag()` defaults to 16 bytes, and `decodeShareId`
  slices `raw.subarray(12, 28)` — 16 bytes, consistent. Correct.
- `decodeShareId` wraps the entire decode/decrypt/parse path in one
  `try/catch` returning `null` on any failure (bad base64, bad tag length,
  failed GCM verification, invalid UTF-8, bad JSON, wrong shape). Verified
  by direct test (see #5) — no uncaught exception path.
- No AAD (`setAAD`) — not needed, nothing external needs authenticating
  alongside the ciphertext.
- Both call sites (`page.tsx` via `notFound()`, `/api/reveal/[id]` via a
  404 JSON response) treat `null` uniformly; neither call site does its own
  parsing or trusts partial output. Reused, not reimplemented, matching the
  changelog's claim.
- `getSecret()`'s dev-fallback (random secret generated at process startup
  when `SHARE_SECRET` is unset, hard error in production) is unchanged from
  v1 and still sound — production can't silently run on a generated key.

**5. Deliberate break (old-format v2 links 404) — actually true?**

Verified empirically, not just by reading the diff. Reconstructed the old
`<base64url-payload>.<sig>` format from the pre-fix `share.ts`
(`git show 72fd2e6~1`) and ran it through the new `decodeShareId` logic
directly (Node, same crypto calls):

- old-format id (`base64url(json).sig`) → `null`, no throw
- empty string → `null`
- short garbage (`"abc"`) → `null`
- random 30 bytes base64url'd → `null`

The `.` in the old format isn't valid base64url alphabet, but Node's
base64 decoder silently skips invalid characters rather than throwing, so
`Buffer.from(id, "base64url")` doesn't fail — it produces some bytes,
sliced into iv/tag/ciphertext, and `decipher.final()` throws on GCM tag
verification failure. That throw is caught by the `try/catch`, `decodeShareId`
returns `null`, and both call sites turn that into a clean 404 — not a
crash, not a hang, not a leak. The changelog's claim holds.

An in-flight old link during the fix window (someone opens a v2 link
between when it was shared and when this fix deployed) breaks the same way:
clean 404, same as any other invalid id, not a special-cased or unhandled
path. Acceptable per the changelog's own reasoning (v2 shipped same-session,
so exposure window and share count are both near-zero) — and now confirmed
mechanically rather than asserted.

## Verdict

**Sufficient to consider closed.** The fix addresses the actual P0 (id is
the URL, so encoding without encryption was never confidentiality) at the
root — the whole payload is encrypted, not just `o`, closing the
intermediate `t`-forgery hole the changelog says was caught pre-commit.
Key derivation, nonce handling, and the AEAD-replaces-HMAC reasoning all
check out on direct code reading, not just on the commit message's say-so.
The one gap — no entropy floor on `SHARE_SECRET` — predates this commit,
applies equally to v1, and isn't this fix's problem to solve. The deliberate
old-link break is verified true and verified graceful, not just claimed.

No follow-up required before this is closed.
