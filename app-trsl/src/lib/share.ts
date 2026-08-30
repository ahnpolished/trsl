// Share IDs are the payload: base64url-encode {t: translatedText, o: originalText},
// sign it with HMAC-SHA256, and use `<payload>.<sig>` directly as the /m/[id]
// route param. No database — decode+verify is the read.
//
// ponytail: content lives in the URL, so links are as long as the message
// (<=1000 chars in; worst case ~4000 encoded chars for 1000 non-ASCII/CJK
// chars, since base64url expands UTF-8 bytes ~1.33x and each CJK char is
// 3 bytes). Comfortably under Vercel's request-URL limits. If a real
// per-message store or shortening ever becomes necessary, that's the
// upgrade trigger.
//
// The HMAC signature (server-only SHARE_SECRET) is what stops anyone from
// hand-crafting an id: without the secret you can't produce a signature
// that verifies, so a tampered/forged id decodes to null -> 404, same as
// garbage input. This is what makes the DECLINE guardrail (enforced only
// in the translate route, which is the only place encodeShareId is called)
// actually hold on direct URL access too.
//
// v2: payload now carries `o` (original) alongside `t` (translated), both
// covered by the same signature. `original` never leaves the server on the
// initial /m/[id] render — only decodeShareId() call sites that explicitly
// read `.o` (the reveal route) ever send it to a client. The /m/[id] page
// itself must only forward `.t` to its client component.

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

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

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url").slice(0, 22);
}

export function encodeShareId(translated: string, original: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: translated, o: original } satisfies SharePayload)
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeShareId(id: string): SharePayload | null {
  const dot = id.indexOf(".");
  if (dot === -1) return null;
  const payload = id.slice(0, dot);
  const sig = id.slice(dot + 1);

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof parsed?.t === "string" && typeof parsed?.o === "string" ? parsed : null;
  } catch {
    return null;
  }
}
