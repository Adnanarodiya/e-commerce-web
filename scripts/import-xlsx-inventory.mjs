/**
 * Import "kutub khana stock list (1).xlsx" → data/urdu-kitab-inventory.json
 *
 * Excel columns (no header row):
 *   0:#  1:name  2:cost_price  3:weight  4:price  5:stock
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function findXlsx() {
  const preferred = path.join(root, "kutub khana stock list (1).xlsx");
  if (fs.existsSync(preferred)) return preferred;
  const match = fs
    .readdirSync(root)
    .find((f) => /kutub.*stock.*\.xlsx$/i.test(f) || /stock list.*\.xlsx$/i.test(f));
  if (!match) {
    throw new Error("Could not find kutub khana stock list Excel in project root");
  }
  return path.join(root, match);
}

function parseMoney(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function parseWeight(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, value);
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Math.max(0, Number(match[0])) : 0;
}

function parseStock(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value));
  const match = String(value ?? "").match(/-?\d+(?:\.\d+)?/);
  return match ? Math.max(0, Math.round(Number(match[0]))) : 0;
}

const XLSX = require("xlsx");
const xlsxPath = findXlsx();
console.log(`Reading: ${path.basename(xlsxPath)}`);

const workbook = XLSX.readFile(xlsxPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

const inventory = [];
for (const row of rows) {
  if (!Array.isArray(row) || row.length < 6) continue;

  const name = String(row[1] ?? "").trim();
  if (!name) continue;

  const cost_price = parseMoney(row[2]);
  const weight = parseWeight(row[3]);
  const price = parseMoney(row[4]);
  const stock = parseStock(row[5]);
  const is_quran = /quran shareef|quran sharif/i.test(name);

  inventory.push({
    name,
    cost_price,
    weight: weight || 80,
    price,
    stock,
    ...(is_quran ? { is_quran: true } : {}),
  });
}

if (inventory.length < 10) {
  console.error(`Too few rows parsed (${inventory.length}). Check Excel format.`);
  process.exit(1);
}

const outPath = path.join(root, "data/urdu-kitab-inventory.json");
fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2) + "\n", "utf8");

const totalStock = inventory.reduce((s, b) => s + b.stock, 0);
console.log(`\nWrote ${inventory.length} books → data/urdu-kitab-inventory.json`);
console.log(`Total stock units: ${totalStock.toLocaleString("en-IN")}`);
console.log(
  `First: ${inventory[0].name} — cost ${inventory[0].cost_price}, weight ${inventory[0].weight}g, price ${inventory[0].price}, stock ${inventory[0].stock}`
);
console.log(
  `Last:  ${inventory[inventory.length - 1].name} — stock ${inventory[inventory.length - 1].stock}`
);
