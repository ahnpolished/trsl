import OpenAI from "openai";

export const MAX_CHARS = 1000;
export const MAX_CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `You rewrite texts between partners.

Maximum 7 words. Count them before you output. If you wrote 8, cut one. Output raw text only—no quotes, no labels, no prefixes.

Never say:
- "I've been feeling"
- "I feel like"
- "what I'm noticing is"
- "I need you to understand"
- "I just want you to know"
- "hold space"

Sound like something you'd text with your thumbs. Brief, casual, understated.

Examples (raw → rewritten):
"you never listen" → "you're not hearing me"
"who were you texting" → "who was that from"
"i'm done" → "can't do this right now"
"do you even see me" → "i need you right now"
"i hate when you're late" → "waiting sucks"
"you made me feel stupid" → "that one stung"
"i shouldn't have said that" → "that came out wrong, sorry"
"don't talk to me like that" → "not when you talk like that"

DECLINE for: physical threats, sexual coercion, statements that could reasonably be read as self-harm (even if ambiguous), or messages that name weapons. Ambiguous self-harm → decline. "i can't do this anymore", "everyone would be better off without me", "i wish i weren't here" — decline, don't guess. Strong emotions (anger, hurt, "i'm done", "leave me alone") are NOT decline triggers — rewrite them, don't refuse them.`;

export type Tone = "gentle" | "direct" | "playful" | "honest" | "boundary";

const TONE_PROMPTS: Record<Tone, string> = {
  gentle: "gentle tone — warm and soft, like a note on the fridge. cushion the ask, don't drop it.",
  direct: "direct tone — say it plain. no cushion, no lead-in. fewest words that land the point.",
  playful: "playful tone — tease, don't accuse. reframe it as something you'd smile typing. one emoji max if it fits.",
  honest: "honest tone — raw and unperformed. say the thing you'd only say with no audience.",
  boundary: "boundary tone — a line, not a negotiation. short, final, not mean.",
};

function buildSystemPrompt(tone?: Tone): string {
  return tone ? `${SYSTEM_PROMPT}\n\nTone the sender wants: ${TONE_PROMPTS[tone]}` : SYSTEM_PROMPT;
}

function buildUserContent(raw: string, context?: string): string {
  return context ? `${raw}\n\n[context: ${context}]` : raw;
}

export type TranslateResult =
  | { ok: true; translated: string }
  | { ok: false; declined: true }
  | { ok: false; declined: false; error: string };

export type TranslateBatchResult =
  | { ok: true; variants: string[] }
  | { ok: false; declined: true }
  | { ok: false; declined: false; error: string };

// ponytail: fixed timeout, not a config knob — bump here if a future model
// needs more headroom.
const REQUEST_TIMEOUT_MS = 20_000;

function startsWithDecline(text: string): boolean {
  return text.trim().toUpperCase().startsWith("DECLINE");
}

export async function translate(raw: string, context?: string, tone?: Tone): Promise<TranslateResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, declined: false, error: "Server is missing OPENAI_API_KEY." };
  }

  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  const userContent = buildUserContent(raw, context);

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

    if (startsWithDecline(text)) {
      return { ok: false, declined: true };
    }
    return { ok: true, translated: text };
  } catch (err) {
    return { ok: false, declined: false, error: err instanceof Error ? err.message : "Translation failed." };
  }
}

// v4: generate multiple variants with DECLINE post-check.
// We intentionally do not run a separate pre-check probe: QA found it
// produced false positives on benign short messages (e.g. "fine"). Instead
// we generate the batch and discard it if any variant starts with DECLINE.
// This still catches threats/self-harm/coercion while avoiding the probe's
// over-classification. See state/versions/v4/QA.md P1.
export async function translateBatch(
  raw: string,
  context?: string,
  tone?: Tone,
  count = 3
): Promise<TranslateBatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { ok: false, declined: false, error: "Server is missing OPENAI_API_KEY." };
  }

  const client = new OpenAI({ apiKey, timeout: REQUEST_TIMEOUT_MS });
  const userContent = buildUserContent(raw, context);

  try {
    // Generate count variants in one call.
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      n: count,
      temperature: 0.8,
      messages: [
        { role: "system", content: buildSystemPrompt(tone) },
        { role: "user", content: userContent },
      ],
    });

    const variants = completion.choices
      .map((c) => (c.message?.content ?? "").trim())
      .filter((t) => t.length > 0);

    if (variants.length < count) {
      return { ok: false, declined: false, error: "Translation returned fewer variants than expected." };
    }

    // Post-check: any DECLINE in the batch kills the whole batch.
    if (variants.some(startsWithDecline)) {
      return { ok: false, declined: true };
    }

    return { ok: true, variants };
  } catch (err) {
    return { ok: false, declined: false, error: err instanceof Error ? err.message : "Translation failed." };
  }
}
