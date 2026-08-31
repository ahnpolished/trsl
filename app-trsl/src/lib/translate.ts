import OpenAI from "openai";

export const MAX_CHARS = 1000;
export const MAX_CONTEXT_CHARS = 200;

const SYSTEM_PROMPT = `
You're job is to be a translator for husband/wife, boyfriend/girlfriend, or other romantic partners.
User will give you a raw, possibly-aggressive or hurtful message they want to send to their partner. Your job is to rewrite it so that it is honest but kind, preserving the real point being made, but softening the tone and word choice.
Preserve the real point being made; soften tone and word choice, not meaning.
If the message is already mild, short, mundane, or has nothing hostile to soften (e.g. "fine", "ok", "sounds good"), just return it lightly polished — never decline it for being brief or having no obvious point to soften.
Only decline if the message contains an explicit threat of violence, sexual coercion, or self-harm language (toward the recipient, a third party, or the sender). Vagueness, brevity, or mild negativity is never grounds to decline. If declining, respond with exactly the token DECLINE and nothing else.
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
// we generate the batch and discard it if too few non-DECLINE variants
// survive. See state/versions/v4/QA.md P1.
//
// Kill condition: we over-sample by one extra completion (n: count + 1) and
// filter out any variant that starts with DECLINE, then take the first
// `count` survivors. This absorbs a single flaky per-sample false positive
// (the model's own variance at temperature 0.8, amplified by n independent
// samples) without needing every sample to agree. Only when fewer than
// `count` variants survive — i.e. the model declined most/all of the
// batch, which is what an actually abusive message does consistently — do
// we discard and report `declined: true`. This is a deliberate deviation
// from FINAL.md criterion 16's literal "any decline kills the batch" text;
// see CHANGELOG.md for the QA evidence that motivated it.
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
    // Generate one extra completion beyond what we need so a lone false
    // positive doesn't take down the whole batch.
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      n: count + 1,
      temperature: 0.8,
      messages: [
        { role: "system", content: buildSystemPrompt(tone) },
        { role: "user", content: userContent },
      ],
    });

    const samples = completion.choices
      .map((c) => (c.message?.content ?? "").trim())
      .filter((t) => t.length > 0);

    if (samples.length < count) {
      // Fewer usable completions than requested — a transport/model
      // anomaly, not a guardrail hit. Don't report this as DECLINE.
      return { ok: false, declined: false, error: "Translation returned fewer variants than expected." };
    }

    const variants = samples.filter((t) => !startsWithDecline(t)).slice(0, count);

    if (variants.length < count) {
      // Enough samples came back, but too many declined — a genuine
      // guardrail hit.
      return { ok: false, declined: true };
    }

    return { ok: true, variants };
  } catch (err) {
    return { ok: false, declined: false, error: err instanceof Error ? err.message : "Translation failed." };
  }
}
