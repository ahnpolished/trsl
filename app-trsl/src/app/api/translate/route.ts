import { NextRequest, NextResponse } from "next/server";
import { translate, MAX_CHARS, MAX_CONTEXT_CHARS, type Tone } from "@/lib/translate";
import { encodeShareId } from "@/lib/share";

const VALID_TONES: Tone[] = ["gentle", "direct", "playful", "honest", "boundary"];

export async function POST(req: NextRequest) {
  let body: { text?: unknown; context?: unknown; tone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_CHARS} characters).` },
      { status: 400 }
    );
  }

  const context = typeof body.context === "string" ? body.context : undefined;
  if (context && context.length > MAX_CONTEXT_CHARS) {
    return NextResponse.json(
      { error: `Context is too long (max ${MAX_CONTEXT_CHARS} characters).` },
      { status: 400 }
    );
  }

  const tone = typeof body.tone === "string" && VALID_TONES.includes(body.tone as Tone)
    ? (body.tone as Tone)
    : undefined;

  const result = await translate(text, context, tone);

  if (!result.ok && result.declined) {
    return NextResponse.json({ declined: true }, { status: 200 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const id = encodeShareId(result.translated, text);

  return NextResponse.json({ id, translated: result.translated });
}
