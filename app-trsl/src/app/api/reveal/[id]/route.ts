import { NextResponse } from "next/server";
import { decodeShareId } from "@/lib/share";

// The only place `original` ever leaves the server. Re-verifies the same
// HMAC signature /m/[id] already checks — no separate auth, no new trust
// model. localStorage sender/unlock flags are not checked here on purpose
// (see FINAL.md "Resolved" #1) — any caller with a valid id gets `original`,
// same trust level v1 already gave `translated`.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const message = decodeShareId(id);

  if (!message) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ original: message.o });
}
