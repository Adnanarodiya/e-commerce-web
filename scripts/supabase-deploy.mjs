import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
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
const accessToken = env.SUPABASE_ACCESS_TOKEN;

function run(cmd, args, extraEnv = {}) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function pushViaPg() {
  if (!projectRef || !dbPassword) {
    throw new Error("Missing SUPABASE_DB_PASSWORD or project ref");
  }

  const connectionString =
    env.SUPABASE_DB_URL ||
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected to Supabase Postgres.");

  const migrationsDir = path.join(root, "supabase", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY
    );
  `).catch(async () => {
    await client.query("CREATE SCHEMA IF NOT EXISTS supabase_migrations;");
    await client.query(`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version text PRIMARY KEY
      );
    `);
  });

  for (const file of files) {
    const version = file.replace(".sql", "");
    const { rows } = await client.query(
      "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
      [version]
    );
    if (rows.length > 0) {
      console.log(`Skip ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)",
        [version]
      );
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  }

  await client.end();
}

async function main() {
  console.log("Supabase deploy for project:", projectRef || "(unknown)");

  if (accessToken) {
    run("npx", ["supabase", "login", "--token", accessToken, "--no-browser"]);
    if (projectRef) {
      const linkArgs = ["supabase", "link", "--project-ref", projectRef, "--yes"];
      if (dbPassword) linkArgs.push("--password", dbPassword);
      run("npx", linkArgs, { SUPABASE_ACCESS_TOKEN: accessToken });
    }
    run("npx", ["supabase", "db", "push", "--linked", "--yes"], {
      SUPABASE_ACCESS_TOKEN: accessToken,
    });
  } else if (dbPassword) {
    await pushViaPg();
  } else {
    console.log(`
Could not deploy automatically — credentials missing.

Option A (recommended, one-time in your terminal):
  npx supabase login
  npx supabase link --project-ref ${projectRef}
  npx supabase db push
  npm run update-cost-prices

Option B (no browser — add to .env.local):
  SUPABASE_DB_PASSWORD=your_database_password
  Then run: npm run supabase:deploy

Option C (personal access token from supabase.com/dashboard/account/tokens):
  SUPABASE_ACCESS_TOKEN=sbp_...
  SUPABASE_DB_PASSWORD=your_database_password
  Then run: npm run supabase:deploy
`);
    process.exit(1);
  }

  console.log("\nUpdating buying prices...");
  run("node", ["scripts/update-cost-prices.mjs"]);
  console.log("\nSupabase deploy complete.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
