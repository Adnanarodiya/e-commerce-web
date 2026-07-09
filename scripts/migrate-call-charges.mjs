import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

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
const projectRef =
  env.SUPABASE_PROJECT_REF ||
  (env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "");
const dbPassword = env.SUPABASE_DB_PASSWORD;
const migrationFile = "20260709100000_add_call_confirmed_charges.sql";

async function main() {
  if (!projectRef || !dbPassword) {
    console.error(`
Missing SUPABASE_DB_PASSWORD in .env.local

Get it from: Supabase Dashboard → Project Settings → Database → Database password
Then add to .env.local:
  SUPABASE_DB_PASSWORD=your_password

Then run: npm run migrate:call-charges
`);
    process.exit(1);
  }

  const connectionString =
    env.SUPABASE_DB_URL ||
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const sql = fs.readFileSync(
    path.join(root, "supabase", "migrations", migrationFile),
    "utf8"
  );

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres.");

  await client.query(`
    CREATE SCHEMA IF NOT EXISTS supabase_migrations;
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY
    );
  `);

  const version = migrationFile.replace(".sql", "");
  const { rows } = await client.query(
    "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
    [version]
  );

  if (rows.length > 0) {
    console.log(`Migration ${migrationFile} already applied.`);
    await client.end();
    return;
  }

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(
      "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)",
      [version]
    );
    await client.query("COMMIT");
    console.log(`Applied ${migrationFile} successfully.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
