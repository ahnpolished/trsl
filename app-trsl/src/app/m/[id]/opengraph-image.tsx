import { ImageResponse } from "next/og";
import { decodeShareId } from "@/lib/share";

export const alt = "A message sent via trsl";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = decodeShareId(id);

  // Fallback for invalid/missing IDs
  if (!payload) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
            color: "#888",
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          trsl
        </div>
      ),
      { ...size }
    );
  }

  const text = payload.t;

  // Scale font size to fit long messages
  const fontSize = text.length > 100 ? 40 : text.length > 50 ? 52 : 64;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          padding: 80,
        }}
      >
        <div
          style={{
            display: "flex",
            background: "#1a1a1a",
            borderRadius: 16,
            padding: 48,
            maxWidth: 1000,
            border: "1px solid #262626",
          }}
        >
          <p
            style={{
              color: "#eee",
              fontSize,
              lineHeight: 1.4,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {text}
          </p>
        </div>
        <p
          style={{
            color: "#666",
            fontSize: 24,
            marginTop: 32,
          }}
        >
          sent via trsl · view original inside
        </p>
      </div>
    ),
    { ...size }
  );
}
