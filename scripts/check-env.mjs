import fs from "node:fs";
import path from "node:path";

function parseDotEnvFile(contents) {
  const out = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // strip simple quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const root = process.cwd();
const envPath = path.join(root, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("[check-env] .env.local not found in project root.");
  console.error("[check-env] Create it by copying env.example -> .env.local");
  process.exit(1);
}

const parsed = parseDotEnvFile(fs.readFileSync(envPath, "utf8"));

const requiredKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const results = requiredKeys.map((k) => [k, Boolean(parsed[k])]);

console.log("[check-env] Required keys present:");
for (const [k, ok] of results) {
  console.log(`- ${k}: ${ok ? "YES" : "NO"}`);
}

if (parsed.NEXT_PUBLIC_SUPABASE_URL) {
  const url = parsed.NEXT_PUBLIC_SUPABASE_URL;
  const looksLikeSupabase =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) ||
    /^https:\/\/[a-z0-9-]+\.supabase\.in$/i.test(url);
  console.log(
    `- NEXT_PUBLIC_SUPABASE_URL format: ${looksLikeSupabase ? "OK" : "CHECK"}`
  );
}

const missing = results.filter(([, ok]) => !ok).map(([k]) => k);
if (missing.length) {
  console.error(
    `[check-env] Missing: ${missing.join(", ")}. Copy env.example -> .env.local and set them.`
  );
  process.exit(1);
}

console.log("[check-env] Looks good.");


