// Storage for translated messages, keyed by UUID.
//
// Real deploy: set KV_REST_API_URL + KV_REST_API_TOKEN (Vercel KV / Upstash
// Redis REST API — same protocol, no extra SDK needed for one GET/SET).
//
// ponytail: no creds in this sandbox, so without them we fall back to a JSON
// file on disk (.data/messages.json). That's fine for `npm run dev` but does
// NOT survive Vercel's serverless filesystem (read-only, per-invocation) —
// wire real KV env vars before deploying. Upgrade trigger: KV_REST_API_URL set.

export type StoredMessage = { translated: string; createdAt: number };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function kvSet(id: string, value: StoredMessage) {
  const res = await fetch(`${KV_URL}/set/msg:${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
}

async function kvGet(id: string): Promise<StoredMessage | null> {
  const res = await fetch(`${KV_URL}/get/msg:${id}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
  const { result } = await res.json();
  if (!result) return null;
  return typeof result === "string" ? JSON.parse(result) : result;
}

// --- file-based dev fallback ---
import { promises as fs } from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".data", "messages.json");

async function readFileStore(): Promise<Record<string, StoredMessage>> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function fileSet(id: string, value: StoredMessage) {
  const store = await readFileStore();
  store[id] = value;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

async function fileGet(id: string): Promise<StoredMessage | null> {
  const store = await readFileStore();
  return store[id] ?? null;
}

const usingKV = Boolean(KV_URL && KV_TOKEN);

export async function saveMessage(id: string, value: StoredMessage) {
  return usingKV ? kvSet(id, value) : fileSet(id, value);
}

export async function getMessage(id: string): Promise<StoredMessage | null> {
  return usingKV ? kvGet(id) : fileGet(id);
}
