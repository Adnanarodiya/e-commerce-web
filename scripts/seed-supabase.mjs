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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const books = JSON.parse(
  fs.readFileSync(path.join(root, "data/urdu-kitab-inventory.json"), "utf8")
);

if (books.length !== 116) {
  console.warn(`Expected 116 Urdu Kitab titles, found ${books.length}.`);
}

const seen = {};
const rows = books.map((row) => {
  const key = row.name.toUpperCase();
  seen[key] = (seen[key] || 0) + 1;
  const suffix = seen[key] > 1 ? ` (${seen[key]})` : "";
  const name_en = row.name + suffix;
  const is_quran =
    row.is_quran === true || /quran shareef|quran sharif/i.test(row.name);

  return {
    name_en,
    name_ur: name_en,
    price: Number(row.price),
    cost_price: Number(row.cost_price) || 0,
    description_en: `Educational Islamic book from Noorani Makatib: ${name_en}.`,
    description_ur: `نورانی مکاتب کی تعلیمی اسلامی کتاب: ${name_en}۔`,
    image: "",
    stock: Number(row.stock) || 0,
    weight: Math.max(0, Number(row.weight) || 0) || 80,
    is_quran,
  };
});

async function probeCostPriceColumn() {
  const { error } = await supabase.from("books").select("cost_price").limit(1);
  return !error;
}

async function deleteAll(table, column, notValue) {
  const { error } = await supabase.from(table).delete().neq(column, notValue);
  if (error) throw new Error(`Failed to clear ${table}: ${error.message}`);
}

console.log("Cleaning database (orders + books)...");
await deleteAll("order_items", "id", 0);
await deleteAll("orders", "id", "");
await deleteAll("books", "id", 0);

const hasCostPrice = await probeCostPriceColumn();
if (!hasCostPrice) {
  console.error(
    "books.cost_price column missing. Run: npx supabase db push\nThen re-run: npm run seed-books"
  );
  process.exit(1);
}

console.log(`Inserting ${rows.length} Urdu Kitab titles only...`);
const chunkSize = 50;
for (let i = 0; i < rows.length; i += chunkSize) {
  const chunk = rows.slice(i, i + chunkSize);
  const { error } = await supabase.from("books").insert(chunk);
  if (error) {
    console.error(`Insert failed at chunk ${i}:`, error.message);
    process.exit(1);
  }
  console.log(`  inserted ${Math.min(i + chunkSize, rows.length)} / ${rows.length}`);
}

const [{ count: bookCount }, { count: orderCount }, { count: itemCount }] =
  await Promise.all([
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("order_items").select("*", { count: "exact", head: true }),
  ]);

console.log("\nDatabase clean and seeded:");
console.log(`  Books: ${bookCount} (Urdu Kitab catalog only)`);
console.log(`  Orders: ${orderCount}`);
console.log(`  Order items: ${itemCount}`);
