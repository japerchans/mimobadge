import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { seedWorkspace } from "./seed";
import { savePostgres } from "./repository";
import { buildMemoryGraph } from "../domain/memory-graph";
import type { Information } from "../types";
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
    else {
      const rows = await client.query<{ data: Information }>(
        "SELECT data FROM information WHERE facility_id='sakura'",
      );
      const graph = buildMemoryGraph(rows.rows.map((row) => row.data));
      // savePostgres upserts deterministic graph rows and does not reset existing care data.
      for (const [table, values] of [
        ["memory_nodes", graph.memoryNodes],
        ["memory_episodes", graph.memoryEpisodes],
        ["memory_edges", graph.memoryEdges],
      ] as const) {
        await client.query(`DELETE FROM ${table} WHERE facility_id='sakura'`);
        for (const item of values) {
          const columns = table === "memory_episodes" ? ",recording_id" : "";
          const args = [item.id, item.residentId, JSON.stringify(item)];
          if ("recordingId" in item) args.push(item.recordingId);
          await client.query(
            `INSERT INTO ${table}(id,facility_id,resident_id,data${columns}) VALUES($1,'sakura',$2,$3${columns ? ",$4" : ""})`,
            args,
          );
        }
      }
    }
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
