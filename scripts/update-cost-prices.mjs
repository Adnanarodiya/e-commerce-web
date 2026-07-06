import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv(file) {
  const envPath = path.join(root, file);
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    out[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return out;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const books = JSON.parse(
  fs.readFileSync(path.join(root, "data/urdu-kitab-inventory.json"), "utf8")
);

const seen = {};
const catalog = books.map((row) => {
  const key = row.name.toUpperCase();
  seen[key] = (seen[key] || 0) + 1;
  const suffix = seen[key] > 1 ? ` (${seen[key]})` : "";
  return {
    name_en: row.name + suffix,
    cost_price: Number(row.cost_price) || 0,
  };
});

const { error: probeError } = await supabase.from("books").select("cost_price").limit(1);
if (probeError) {
  console.error("cost_price column not found. Run migration first:");
  console.error("ALTER TABLE books ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0;");
  process.exit(1);
}

const { data: existing, error: fetchError } = await supabase
  .from("books")
  .select("id, name_en");
if (fetchError || !existing) {
  console.error("Failed to fetch books:", fetchError?.message);
  process.exit(1);
}

let updated = 0;
for (const book of existing) {
  const match = catalog.find((c) => c.name_en === book.name_en);
  if (!match) continue;
  const { error } = await supabase
    .from("books")
    .update({ cost_price: match.cost_price })
    .eq("id", book.id);
  if (!error) updated++;
}

console.log(`Updated buying price on ${updated} / ${existing.length} books.`);
