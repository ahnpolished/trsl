import { NextRequest, NextResponse } from "next/server";
import { encodeShareId } from "@/lib/share";
import { MAX_CHARS, translate } from "@/lib/translate";

export async function POST(req: NextRequest) {
  let body: { 
    translated?: unknown; 
    original?: unknown;
    variants?: unknown;
    selectedIndex?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const translated = typeof body.translated === "string" ? body.translated : "";
  const original = typeof body.original === "string" ? body.original : "";
  const variants = Array.isArray(body.variants) ? body.variants : [];
  const selectedIndex = typeof body.selectedIndex === "number" ? body.selectedIndex : -1;

  if (!translated.trim() || !original.trim()) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }
  if (translated.length > MAX_CHARS || original.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_CHARS} characters).` },
      { status: 400 }
    );
  }

  // Check if text was edited (differs from the original variant)
  const originalVariant = selectedIndex >= 0 && selectedIndex < variants.length 
    ? variants[selectedIndex] 
    : "";
  const wasEdited = originalVariant && translated !== originalVariant;

  // If text was edited, re-run DECLINE check
  if (wasEdited) {
    const declineCheck = await translate(translated);
    if (!declineCheck.ok && declineCheck.declined) {
      return NextResponse.json(
        { error: "This message can't be translated as written." },
        { status: 400 }
      );
    }
    // If the check itself errors, fail closed (don't issue share id)
    if (!declineCheck.ok && !declineCheck.declined) {
      return NextResponse.json(
        { error: "Unable to verify message. Please try again." },
        { status: 500 }
      );
    }
  }

  const id = encodeShareId(translated, original);

  return NextResponse.json({ id, translated });
}
