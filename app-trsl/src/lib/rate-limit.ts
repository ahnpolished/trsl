// In-memory rate/cost guardrails for /api/translate.
//
// ponytail: these are best-effort for a single server instance. On Vercel's
// serverless platform each invocation may run in a fresh process, so a
// determined actor can bypass per-IP and daily ceilings by spreading
// requests across instances. The real fix is a shared store (Redis/Vercel KV)
// once traffic justifies it; this module is the minimal gate that works
// without adding a new backend service.

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: string };

// Per-IP sliding window: max requests per minute.
const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 10;

// Hard daily spend ceiling in USD (estimated from actual token spend).
const DAILY_SPEND_CEILING_USD = 10;

// gpt-4o-mini pricing (per 1M tokens) as of 2026-08. These are approximations
// used only for the spend ceiling; real billing may differ slightly.
const INPUT_COST_PER_1M = 0.15;
const OUTPUT_COST_PER_1M = 0.6;

// Estimated tokens per request:
// - probe: ~500 input + 1 output
// - batch (n=3): ~500 input + 300 output
// We charge the ceiling at the batch rate to keep it simple.
const ESTIMATED_INPUT_TOKENS = 1000; // probe + batch input, rounded up
const ESTIMATED_OUTPUT_TOKENS = 301; // probe + batch output, rounded up
const ESTIMATED_COST_PER_REQUEST_USD =
  (ESTIMATED_INPUT_TOKENS / 1_000_000) * INPUT_COST_PER_1M +
  (ESTIMATED_OUTPUT_TOKENS / 1_000_000) * OUTPUT_COST_PER_1M;

interface IpEntry {
  timestamps: number[];
}

const ipMap = new Map<string, IpEntry>();

let dailySpend = 0;
let currentSpendDay = new Date().toISOString().slice(0, 10);

function pruneIpWindow(now: number): void {
  for (const entry of ipMap.values()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < IP_WINDOW_MS);
  }
}

function getClientIp(req: Request): string {
  // Vercel forwards the client IP in this header; fall back to a placeholder
  // so local/dev requests still exercise the same code path.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export function checkRateLimit(req: Request): RateLimitResult {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentSpendDay) {
    currentSpendDay = today;
    dailySpend = 0;
  }

  if (dailySpend >= DAILY_SPEND_CEILING_USD) {
    return { allowed: false, reason: "Daily translation budget exhausted. Try again tomorrow." };
  }

  const now = Date.now();
  pruneIpWindow(now);

  const ip = getClientIp(req);
  let entry = ipMap.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    ipMap.set(ip, entry);
  }

  if (entry.timestamps.length >= IP_MAX_REQUESTS) {
    return { allowed: false, reason: "Too many translation requests. Please wait a minute." };
  }

  entry.timestamps.push(now);
  dailySpend += ESTIMATED_COST_PER_REQUEST_USD;

  return { allowed: true };
}
