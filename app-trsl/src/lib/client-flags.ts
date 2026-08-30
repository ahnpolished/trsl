// localStorage-backed id sets for UI routing only: "did this device send this
// id" and "did this device already unlock this id". Not auth — see FINAL.md
// "Resolved" #1. /api/reveal/[id] never checks these; they only decide which
// screen the client shows.

export const SENT_IDS_KEY = "trsl:sent-ids";
export const UNLOCKED_IDS_KEY = "trsl:unlocked-ids";

function readSet(key: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function hasId(key: string, id: string): boolean {
  try {
    return readSet(key).has(id);
  } catch {
    return false;
  }
}

export function addId(key: string, id: string): void {
  try {
    const set = readSet(key);
    set.add(id);
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    // private mode / storage disabled — flag just doesn't stick, fine for a UI heuristic
  }
}
