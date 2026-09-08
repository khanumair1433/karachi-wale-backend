import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, "..", "data.json");

const defaultData = {
  // users keyed by phone number, e.g. "+923001234567"
  users: {},
  // otps keyed by phone number: { code, expiresAt }
  otps: {},
  // contacts: { [ownerPhone]: [{ phone, name }] }
  contacts: {},
  // conversations keyed by "phoneA__phoneB" (sorted): [{ id, from, text, ts }]
  conversations: {},
};

export const db = new Low(new JSONFile(file), defaultData);

export async function loadDb() {
  await db.read();
  db.data ||= structuredClone(defaultData);
  await db.write();
}

export function conversationId(a, b) {
  return [a, b].sort().join("__");
}
