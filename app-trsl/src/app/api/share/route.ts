import { NextRequest, NextResponse } from "next/server";
import { encodeShareId } from "@/lib/share";
import { MAX_CHARS } from "@/lib/translate";

export async function POST(req: NextRequest) {
  let body: { translated?: unknown; original?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const translated = typeof body.translated === "string" ? body.translated : "";
  const original = typeof body.original === "string" ? body.original : "";

  if (!translated.trim() || !original.trim()) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (translated.length > MAX_CHARS || original.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_CHARS} characters).` },
      { status: 400 }
    );
  }

  const id = encodeShareId(translated, original);

  return NextResponse.json({ id, translated });
}
