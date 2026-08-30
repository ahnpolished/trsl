import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMessage } from "@/lib/storage";

export const metadata: Metadata = {
  title: "trsl",
  description: "Someone sent you a message via trsl.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "trsl",
    description: "Someone sent you a message via trsl.",
    images: ["/og-image.png"],
  },
};

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = await getMessage(id);

  if (!message) notFound();

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>trsl</h1>
      <div style={{ padding: 16, borderRadius: 8, background: "#1a1a1a" }}>
        <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>
          {message.translated}
        </p>
      </div>
    </main>
  );
}
