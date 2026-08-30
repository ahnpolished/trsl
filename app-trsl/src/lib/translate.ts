import OpenAI from "openai";

export const MAX_CHARS = 1000;

const SYSTEM_PROMPT = `
You're job is to be a translator for husband/wife, boyfriend/girlfriend, or other romantic partners. 
User will give you a raw, possibly-aggressive or hurtful message they want to send to their partner. Your job is to rewrite it so that it is honest but kind, preserving the real point being made, but softening the tone and word choice.
Preserve the real point being made; soften tone and word choice, not meaning. 
If the message contains threats, sexual coercion, or self-harm language (toward the recipient, a third party, or the sender), do not rewrite it — respond with exactly the token DECLINE and nothing else.
`;

export type TranslateResult =
  | { ok: true; translated: string }
  | { ok: false; declined: true }
  | { ok: false; declined: false; error: string };

// ponytail: fixed timeout, not a config knob — bump here if a future model
// needs more headroom.
const REQUEST_TIMEOUT_MS = 20_000;

export async function translate(raw: string): Promise<TranslateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, declined: false, error: "Server is missing OPENAI_API_KEY." };
  }

  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: raw },
      ],
    });

    const text = (completion.choices[0]?.message?.content ?? "").trim();

    // ponytail: prefix match tolerates trailing punctuation/explanatory text after the token
    if (text.toUpperCase().startsWith("DECLINE")) {
      return { ok: false, declined: true };
    }
    return { ok: true, translated: text };
  } catch (err) {
    return { ok: false, declined: false, error: err instanceof Error ? err.message : "Translation failed." };
  }
}
