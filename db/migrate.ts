import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { seedWorkspace } from "./seed";
import { savePostgres } from "./repository";
async function main() {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL before migration.");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(await readFile("db/schema.sql", "utf8"));
    const result = await client.query(
      "INSERT INTO facilities(id,name) VALUES('sakura','Sakura Care Home') ON CONFLICT DO NOTHING RETURNING id",
    );
    if (result.rowCount) await savePostgres(client, seedWorkspace());
    await client.query("COMMIT");
    console.log("Schema ready; fictional facility seeded if new.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
