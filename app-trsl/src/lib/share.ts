// Share IDs are the payload: base64url-encode {t: translatedText}, sign it
// with HMAC-SHA256, and use `<payload>.<sig>` directly as the /m/[id] route
// param. No database — decode+verify is the read.
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

import { createHmac, timingSafeEqual } from "crypto";

export type SharePayload = { t: string };

// ponytail: hardcoded fallback so local dev works with zero setup. Never
// used in prod — getSecret() throws if SHARE_SECRET is unset and
// NODE_ENV=production, so this can't silently ship as the real secret.
const DEV_SECRET_FALLBACK = "trsl-dev-only-insecure-secret-do-not-use-in-prod";

function getSecret(): string {
  const secret = process.env.SHARE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SHARE_SECRET env var is required in production.");
  }
  return DEV_SECRET_FALLBACK;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url").slice(0, 22);
}

export function encodeShareId(translated: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: translated } satisfies SharePayload)
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
    return typeof parsed?.t === "string" ? parsed : null;
  } catch {
    return null;
  }
}
