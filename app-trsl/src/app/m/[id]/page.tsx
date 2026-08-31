import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { decodeShareId } from "@/lib/share";
import ShareView from "./ShareView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const message = decodeShareId(id);

  if (!message) {
    return {
      title: "trsl",
      description: "Someone sent you a message via trsl.",
      robots: { index: false, follow: false },
    };
  }

  // Only `translated` appears in meta tags. `original` never leaves the server
  // on this render — it's only fetched later via /api/reveal/[id].
  const truncated =
    message.t.length > 120 ? message.t.slice(0, 117) + "…" : message.t;

  return {
    title: truncated,
    description: "A message sent via trsl · view original inside",
    robots: { index: false, follow: false },
    openGraph: {
      title: truncated,
      description: "A message sent via trsl · view original inside",
      // opengraph-image.tsx in this directory auto-generates the dynamic image
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const message = decodeShareId(id);

  if (!message) notFound();

  // Only `translated` crosses the server->client boundary here. `original`
  // (message.o) stays on the server — it's fetched later, only via
  // /api/reveal/[id], never embedded in this page's HTML/JSON payload.
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>trsl</h1>
      <ShareView id={id} translated={message.t} />
    </main>
  );
}
