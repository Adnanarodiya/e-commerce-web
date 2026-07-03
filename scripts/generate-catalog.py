import pandas as pd

df = pd.read_excel(
    r"C:\Development\AD\e-commerce-web\PRICE LIST.xlsx",
    sheet_name="KITAB PRICE LIST",
    header=None,
)

rows = []
seen_names = {}
for i in range(2, len(df)):
    row = df.iloc[i]
    name = str(row[1]).strip() if pd.notna(row[1]) else ""
    price_raw = row[2]
    if not name or name == "nan":
        continue
    if pd.isna(price_raw) or price_raw == "" or float(price_raw) == 0:
        price = 333
    else:
        price = int(float(price_raw))
    name_en = name.title()
    key = name_en.upper()
    if key in seen_names:
        seen_names[key] += 1
        name_en = f"{name_en} ({seen_names[key]})"
    else:
        seen_names[key] = 1
    rows.append({"name_en": name_en, "name_ur": name_en, "price": price, "stock": 50, "weight": 80})

lines = [
    "// Auto-generated from PRICE LIST.xlsx — do not edit manually",
    "// Blank or zero prices are set to ₹333",
    "",
    "export interface CatalogBook {",
    "  id: number;",
    "  name_en: string;",
    "  name_ur: string;",
    "  price: number;",
    "  description_en: string;",
    "  description_ur: string;",
    "  image: string;",
    "  stock: number;",
    "  weight: number;",
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
]

for idx, b in enumerate(rows, 1):
    ne = b["name_en"].replace("\\", "\\\\").replace('"', '\\"')
    nu = b["name_ur"].replace("\\", "\\\\").replace('"', '\\"')
    lines.extend([
        "  {",
        f"    id: {idx},",
        f'    name_en: "{ne}",',
        f'    name_ur: "{nu}",',
        f"    price: {b['price']},",
        f'    description_en: descEn("{ne}"),',
        f'    description_ur: descUr("{nu}"),',
        "    image: PLACEHOLDER_IMAGE,",
        f"    stock: {b['stock']},",
        f"    weight: {b['weight']}",
        "  },",
    ])

lines.extend(["];", "", "export const DEFAULT_BOOKS = CATALOG_BOOKS;", ""])

with open(r"C:\Development\AD\e-commerce-web\lib\catalog.ts", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

vals = []
for b in rows:
    ne = b["name_en"].replace("'", "''")
    nu = b["name_ur"].replace("'", "''")
    de = f"Educational Islamic book from Noorani Makatib: {b['name_en']}.".replace("'", "''")
    du = f"نورانی مکاتب کی تعلیمی اسلامی کتاب: {b['name_ur']}۔".replace("'", "''")
    vals.append(
        f"('{ne}', '{nu}', {b['price']}, '{de}', '{du}', '', {b['stock']}, {b['weight']})"
    )

sql = "\n".join([
    "-- Seed catalog from PRICE LIST.xlsx (replaces existing books)",
    "-- WARNING: truncates orders — run only on fresh/reset DB",
    "TRUNCATE order_items, orders RESTART IDENTITY CASCADE;",
    "TRUNCATE books RESTART IDENTITY CASCADE;",
    "",
    "INSERT INTO books (name_en, name_ur, price, description_en, description_ur, image, stock, weight) VALUES",
    ",\n".join(vals) + ";",
])

with open(r"C:\Development\AD\e-commerce-web\lib\seed-catalog.sql", "w", encoding="utf-8") as f:
    f.write(sql)

print(f"Generated {len(rows)} books")