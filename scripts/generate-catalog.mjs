import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const raw = JSON.parse(
  fs.readFileSync(path.join(root, "data/urdu-kitab-inventory.json"), "utf8")
);

const descEn = (name) =>
  `Educational Islamic book from Noorani Makatib: ${name}.`;
const descUr = (name) =>
  `نورانی مکاتب کی تعلیمی اسلامی کتاب: ${name}۔`;

const seen = {};
const books = raw.map((row, index) => {
  const key = row.name.toUpperCase();
  seen[key] = (seen[key] || 0) + 1;
  const suffix = seen[key] > 1 ? ` (${seen[key]})` : "";
  const name_en = row.name + suffix;
  const price = Number(row.price);
  const cost_price = Number(row.cost_price);
  const weight = Math.max(0, Number(row.weight) || 0);
  const stock = Number(row.stock) || 0;
  const is_quran =
    row.is_quran === true ||
    /quran shareef|quran sharif/i.test(row.name);

  return {
    id: index + 1,
    name_en,
    name_ur: name_en,
    price,
    cost_price,
    description_en: descEn(name_en),
    description_ur: descUr(name_en),
    image: "",
    stock,
    weight: weight || 80,
    ...(is_quran ? { is_quran: true } : {}),
  };
});

const tsLines = [
  "// Auto-generated from data/urdu-kitab-inventory.json — do not edit manually",
  "",
  "export interface CatalogBook {",
  "  id: number;",
  "  name_en: string;",
  "  name_ur: string;",
  "  price: number;",
  "  cost_price: number;",
  "  description_en: string;",
  "  description_ur: string;",
  "  image: string;",
  "  stock: number;",
  "  weight: number;",
  "  is_quran?: boolean;",
  "}",
  "",
  'export const PLACEHOLDER_IMAGE = "";',
  "",
  "const descEn = (name: string) =>",
  '  `Educational Islamic book from Noorani Makatib: ${name}.`;',
  "const descUr = (name: string) =>",
  '  `نورانی مکاتب کی تعلیمی اسلامی کتاب: ${name}۔`;',
  "",
  "export const CATALOG_BOOKS: CatalogBook[] = [",
];

for (const b of books) {
  const ne = b.name_en.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines = [
    "  {",
    `    id: ${b.id},`,
    `    name_en: "${ne}",`,
    `    name_ur: "${ne}",`,
    `    price: ${b.price},`,
    `    cost_price: ${b.cost_price},`,
    `    description_en: descEn("${ne}"),`,
    `    description_ur: descUr("${ne}"),`,
    "    image: PLACEHOLDER_IMAGE,",
    `    stock: ${b.stock},`,
    `    weight: ${b.weight},`,
  ];
  if (b.is_quran) lines.push("    is_quran: true,");
  lines.push("  },");
  tsLines.push(...lines);
}

tsLines.push("];", "", "export const DEFAULT_BOOKS = CATALOG_BOOKS;", "");

fs.writeFileSync(path.join(root, "lib/catalog.ts"), tsLines.join("\n"), "utf8");

const sqlVals = books.map((b) => {
  const ne = b.name_en.replace(/'/g, "''");
  const de = b.description_en.replace(/'/g, "''");
  const du = b.description_ur.replace(/'/g, "''");
  const quran = b.is_quran ? "TRUE" : "FALSE";
  return `('${ne}', '${ne}', ${b.price}, ${b.cost_price}, '${de}', '${du}', '', ${b.stock}, ${b.weight}, ${quran})`;
});

const seedBooksOnly = [
  "-- Replace book catalog only (keeps existing orders)",
  "DELETE FROM books;",
  "ALTER SEQUENCE books_id_seq RESTART WITH 1;",
  "",
  "INSERT INTO books (name_en, name_ur, price, cost_price, description_en, description_ur, image, stock, weight, is_quran) VALUES",
  sqlVals.join(",\n") + ";",
].join("\n");

const seedFull = [
  "-- Seed full catalog from data/urdu-kitab-inventory.json",
  "-- WARNING: truncates orders — run only on fresh/reset DB",
  "TRUNCATE order_items, orders RESTART IDENTITY CASCADE;",
  "TRUNCATE books RESTART IDENTITY CASCADE;",
  "",
  "INSERT INTO books (name_en, name_ur, price, cost_price, description_en, description_ur, image, stock, weight, is_quran) VALUES",
  sqlVals.join(",\n") + ";",
].join("\n");

fs.writeFileSync(path.join(root, "lib/seed-books-only.sql"), seedBooksOnly, "utf8");
fs.writeFileSync(path.join(root, "lib/seed-catalog.sql"), seedFull, "utf8");

console.log(`Generated ${books.length} books`);
