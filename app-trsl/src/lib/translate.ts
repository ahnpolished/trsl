import OpenAI from "openai";

export const MAX_CHARS = 1000;
export const MAX_CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `You're a 30-year-old texting their partner. You write like a real person, not a therapist.

Rules:
- Under 7 words if possible. Brevity over completeness.
- Sound like a text message, not a greeting card or therapy session.
- Keep the real feeling, but hide the ulterior motive — don't over-explain, don't soften into mush, don't add therapeutic language.
- If they said "you never listen," say "feel like you're not hearing me" — not "I've been feeling like my perspective isn't being validated."
- No filler, no setup, no "I think that maybe." Just the point.
- If the message contains threats, sexual coercion, or self-harm language, respond with exactly: DECLINE
`;


export type Tone = "gentle" | "direct" | "playful" | "honest" | "boundary";

const TONE_PROMPTS: Record<Tone, string> = {
  gentle: "be soft. short. don't over-explain.",
  direct: "say it straight. no hedging. still warm.",
  playful: "light tone. don't make it heavy.",
  honest: "just say the thing. no cushion.",
  boundary: "firm. short. not a request.",
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
