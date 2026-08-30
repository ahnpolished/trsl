import OpenAI from "openai";

export const MAX_CHARS = 1000;
export const MAX_CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `
You're job is to be a translator for husband/wife, boyfriend/girlfriend, or other romantic partners. 
User will give you a raw, possibly-aggressive or hurtful message they want to send to their partner. Your job is to rewrite it so that it is honest but kind, preserving the real point being made, but softening the tone and word choice.
Preserve the real point being made; soften tone and word choice, not meaning. 
If the message contains threats, sexual coercion, or self-harm language (toward the recipient, a third party, or the sender), do not rewrite it — respond with exactly the token DECLINE and nothing else.
`;

export type Tone = "gentle" | "direct" | "playful" | "honest" | "boundary";

const TONE_PROMPTS: Record<Tone, string> = {
  gentle: "be soft and reassuring — lead with care, cushion the point so it lands gently",
  direct: "be clear and unambiguous about the point, but warm in delivery — don't hedge, don't soften the meaning away",
  playful: "keep it light and a little warm/funny — this isn't a heavy moment, don't make it sound like one",
  honest: "prioritize plain truth over cushioning — say the real thing, just without cruelty",
  boundary: "be firm and clear that this is a limit, not a request — kind but non-negotiable",
};

function buildSystemPrompt(tone?: Tone): string {
  return tone ? `${SYSTEM_PROMPT}\n\nTone the sender wants: ${TONE_PROMPTS[tone]}` : SYSTEM_PROMPT;
}

export type TranslateResult =
  | { ok: true; translated: string }
  | { ok: false; declined: true }
  | { ok: false; declined: false; error: string };

// ponytail: fixed timeout, not a config knob — bump here if a future model
// needs more headroom.
const REQUEST_TIMEOUT_MS = 20_000;

export async function translate(raw: string, context?: string, tone?: Tone): Promise<TranslateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, declined: false, error: "Server is missing OPENAI_API_KEY." };
  }

  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });

  const userContent = context ? `${raw}\n\n[context: ${context}]` : raw;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(tone) },
        { role: "user", content: userContent },
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
