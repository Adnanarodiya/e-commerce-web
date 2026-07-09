import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pg from "pg";

const MIGRATION_FILE = "20260709100000_add_call_confirmed_charges.sql";

function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const adminCookie = request.cookies.get("admin_unlocked")?.value;
  if (adminCookie !== "1") {
    return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
  }

  const projectRef = getProjectRef();
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!projectRef || !dbPassword) {
    return NextResponse.json(
      {
        error:
          "Missing SUPABASE_DB_PASSWORD in server env. Add it to .env.local from Supabase Dashboard → Project Settings → Database.",
      },
      { status: 500 }
    );
  }

  const connectionString =
    process.env.SUPABASE_DB_URL ||
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;

  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    MIGRATION_FILE
  );

  if (!fs.existsSync(migrationPath)) {
    return NextResponse.json({ error: "Migration file not found" }, { status: 500 });
  }

  const sql = fs.readFileSync(migrationPath, "utf8");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    await client.query(`
      CREATE SCHEMA IF NOT EXISTS supabase_migrations;
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version text PRIMARY KEY
      );
    `);

    const version = MIGRATION_FILE.replace(".sql", "");
    const { rows } = await client.query(
      "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = $1",
      [version]
    );

    if (rows.length > 0) {
      return NextResponse.json({ ok: true, message: "Migration already applied", version });
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)",
        [version]
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    return NextResponse.json({ ok: true, message: "Migration applied successfully", version });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.end().catch(() => undefined);
  }
}
