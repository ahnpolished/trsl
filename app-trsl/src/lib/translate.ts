import OpenAI from "openai";

export const MAX_CHARS = 1000;
export const MAX_CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `You rewrite messages for someone texting their partner. Keep the feeling, cut the words.

Rules:
- 7 words or fewer. If 3 words work, use 3.
- Write like a real text. No caps, no periods, no setup.
- NEVER say: "I've been feeling", "I think that maybe", "it seems like", "I feel like what's happening is", "my perspective", "I'd appreciate", "I wonder if"
- Don't explain the feeling. Say it like you'd whisper it across the room.
- The softening must be invisible. If it reads as "being careful" — you failed.
- Threats, sexual coercion, or self-harm → respond with exactly: DECLINE

Good:
"you never listen" → "feel like you're not hearing me"
"you always forget" → "keeps slipping your mind"
"i'm done" → "can't do this right now"
"you don't care" → "need to know you're here"
"stop ignoring me" → "haven't heard from you all day"
`;

export type Tone = "gentle" | "direct" | "playful" | "honest" | "boundary";

const TONE_PROMPTS: Record<Tone, string> = {
  gentle: "soft words, same truth. like a note left on the fridge.",
  direct: "say it plain. no lead-in. fewest words that land.",
  playful: "light it up. tease don't accuse. smile while you type it.",
  honest: "raw. no cushion. what you'd say if you stopped performing.",
  boundary: "a wall. not mean, not up for discussion. done.",
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
