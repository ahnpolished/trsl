// ponytail: not a test framework/suite, just one runnable assert-based
// check for the security path in share.ts. Run with:
//   npx tsx src/lib/share.selfcheck.ts
import assert from "assert";
import { encodeShareId, decodeShareId } from "./share";

process.env.SHARE_SECRET ??= "selfcheck-only-secret";

const id = encodeShareId("translated text", "TOP SECRET ORIGINAL");

// Offline base64url/JSON decode (no server secret) must not recover any
// plaintext — the whole payload is opaque ciphertext.
let offlineLeak = false;
try {
  const raw = Buffer.from(id, "base64url").toString("utf8");
  offlineLeak = raw.includes("TOP SECRET") || raw.includes("translated text");
} catch {
  // not valid utf8 JSON — expected, no leak
}
assert(!offlineLeak, "FAIL: original or translated text recoverable via offline decode");

// Server-side decode with the correct secret recovers both fields.
const decoded = decodeShareId(id);
assert(decoded?.t === "translated text" && decoded?.o === "TOP SECRET ORIGINAL", "FAIL: server decode did not recover payload");

// Tampering anywhere in the id — including the `t`-covering region, not
// just the tail — must invalidate the GCM tag and 404.
for (const pos of [0, Math.floor(id.length / 2), id.length - 1]) {
  const chars = id.split("");
  chars[pos] = chars[pos] === "a" ? "b" : "a";
  const tampered = chars.join("");
  assert(decodeShareId(tampered) === null, `FAIL: tampered id at position ${pos} still decoded`);
}

console.log("share.ts self-check passed");
