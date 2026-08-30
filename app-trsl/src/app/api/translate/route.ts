import { NextRequest, NextResponse } from "next/server";
import { translate, MAX_CHARS } from "@/lib/translate";
import { encodeShareId } from "@/lib/share";

export async function POST(req: NextRequest) {
  let body: { text?: unknown };
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

  const result = await translate(text);

  if (!result.ok && result.declined) {
    return NextResponse.json({ declined: true }, { status: 200 });
  }
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const id = encodeShareId(result.translated);

  return NextResponse.json({ id, translated: result.translated });
}
