import Anthropic from "@anthropic-ai/sdk";

export const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `Rewrite the user's message so it is honest but kind — not corporate, not a joke, not passive-aggressive. Preserve the real point being made; soften tone and word choice, not meaning. If the message contains threats, sexual coercion, or self-harm language (toward the recipient, a third party, or the sender), do not rewrite it — respond with exactly the token DECLINE and nothing else.`;

export type TranslateResult =
  | { ok: true; translated: string }
  | { ok: false; declined: true }
  | { ok: false; declined: false; error: string };

export async function translate(raw: string): Promise<TranslateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, declined: false, error: "Server is missing ANTHROPIC_API_KEY." };
  }

  const client = new Anthropic({ apiKey });

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: raw }],
    });

    const text = msg.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (text === "DECLINE") {
      return { ok: false, declined: true };
    }
    return { ok: true, translated: text };
  } catch (err) {
    return { ok: false, declined: false, error: err instanceof Error ? err.message : "Translation failed." };
  }
}
