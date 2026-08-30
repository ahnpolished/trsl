// Share IDs are the payload: {t: translatedText, o: originalText} is
// AES-256-GCM encrypted as one blob with a server-only key derived from
// SHARE_SECRET, and the ciphertext (base64url) is the /m/[id] route param
// directly. No database — decode+decrypt is the read.
//
// The id IS the URL path segment, so anything less than real encryption
// here is plaintext-readable straight from the address bar before any page
// even loads — no client/RSC boundary can hide that (this was a P0: v1/v2
// only base64-encoded + HMAC-signed the payload, which is encoding, not
// encryption). GCM's auth tag is what stops anyone from hand-crafting or
// tampering with an id: without SHARE_SECRET you can't produce ciphertext
// that decrypts, so a tampered/forged id decodes to null -> 404, same as
// garbage input. This is what makes the DECLINE guardrail (enforced only
// in the translate route, which is the only place encodeShareId is called)
// actually hold on direct URL access too. Both `t` and `o` are covered by
// the same auth tag (not just `o`) — `t` isn't secret, but it still must
// not be forgeable, or anyone could rewrite the visible message in place.
//
// ponytail: content lives in the URL, so links are as long as the message
// (<=1000 chars in; worst case ~4000 encoded chars for 1000 non-ASCII/CJK
// chars, since base64url expands UTF-8 bytes ~1.33x and each CJK char is
// 3 bytes, plus a fixed ~40-char IV+tag overhead). Comfortably under
// Vercel's request-URL limits. If a real per-message store or shortening
// ever becomes necessary, that's the upgrade trigger.
//
// v2: payload carries `o` (original) alongside `t` (translated), both
// inside the same encrypted blob. `original` never leaves the server on the
// initial /m/[id] render — only decodeShareId() call sites that explicitly
// read `.o` (the reveal route) ever send it to a client. The /m/[id] page
// itself must only forward `.t` to its client component.

import { createHash, createCipheriv, createDecipheriv, randomBytes } from "crypto";

export type SharePayload = { t: string; o: string };

// ponytail: no hardcoded fallback value to trust or not trust. When
// SHARE_SECRET is unset we generate a random one at process startup — fine
// for dev/single-instance (links just stop verifying across restarts or
// multiple instances). Production still fails loudly instead of silently
// running on a generated secret.
let generatedSecret: string | null = null;

function getSecret(): string {
  const secret = process.env.SHARE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SHARE_SECRET env var is required in production.");
  }
  if (!generatedSecret) {
    generatedSecret = randomBytes(32).toString("base64url");
  }
  return generatedSecret;
}

// AES-256-GCM key derived from SHARE_SECRET — no separate env var needed.
function getKey(): Buffer {
  return createHash("sha256").update(getSecret()).digest();
}

export function encodeShareId(translated: string, original: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const plaintext = JSON.stringify({ t: translated, o: original } satisfies SharePayload);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decodeShareId(id: string): SharePayload | null {
  try {
    const raw = Buffer.from(id, "base64url");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf8"
    );
    const parsed = JSON.parse(plaintext);
    return typeof parsed?.t === "string" && typeof parsed?.o === "string" ? parsed : null;
  } catch {
    return null;
  }
}
