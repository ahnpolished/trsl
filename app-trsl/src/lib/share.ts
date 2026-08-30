// Share IDs are the payload: base64url-encode {t: translatedText} and use it
// directly as the /m/[id] route param. No database — decode is the read.
//
// ponytail: content lives in the URL, so links are as long as the message
// (<=1000 chars in; worst case ~4000 encoded chars for 1000 non-ASCII/CJK
// chars, since base64url expands UTF-8 bytes ~1.33x and each CJK char is
// 3 bytes). Comfortably under Vercel's request-URL limits. If a real
// per-message store or shortening ever becomes necessary, that's the
// upgrade trigger.
//
// Anyone can hand-craft an id and get a valid-looking share page for
// arbitrary text — there's no server-side record of what was actually
// translated. The DECLINE guardrail still gates the translate flow (no
// id is ever produced for declined input via the UI), it just isn't
// enforced on direct URL access. Acceptable for v1 per the same
// unauthenticated-public-links tradeoff FINAL.md already accepted.

export type SharePayload = { t: string };

export function encodeShareId(translated: string): string {
  return Buffer.from(JSON.stringify({ t: translated } satisfies SharePayload)).toString(
    "base64url"
  );
}

export function decodeShareId(id: string): SharePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
    return typeof parsed?.t === "string" ? parsed : null;
  } catch {
    return null;
  }
}
