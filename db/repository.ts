import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";
import { seedWorkspace } from "./seed";
import type { Workspace } from "@/types";
import { ensureMemoryGraph } from "@/domain/memory-graph";
import { ensureStructuredCareRecords } from "@/domain/care-record";
import { ensureDemoProfiles } from "./demo-profiles";
const tables = {
  caregivers: "caregivers",
  residents: "residents",
  recordings: "recordings",
  information: "information",
  records: "care_records",
  audit: "audit_logs",
  handoffs: "handoffs",
  memoryNodes: "memory_nodes",
  memoryEpisodes: "memory_episodes",
  memoryEdges: "memory_edges",
} as const;
const globalDb = globalThis as unknown as {
  mimoPool?: Pool;
  mimoQueue?: Promise<unknown>;
};
export const storageMode = () =>
  process.env.DATABASE_URL ? ("postgresql" as const) : ("local-demo" as const);
function pool() {
  return (globalDb.mimoPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
  }));
}
async function loadPostgres(
  client: PoolClient,
  facilityId: string,
): Promise<Workspace> {
  const facility = await client.query(
    "SELECT id,name FROM facilities WHERE id=$1 FOR UPDATE",
    [facilityId],
  );
  if (!facility.rowCount)
    throw new Error("Facility not provisioned. Run npm run db:migrate.");
  const state = { facility: facility.rows[0] } as Workspace;
  for (const [key, table] of Object.entries(tables)) {
    const rows = await client.query(
      `SELECT data FROM ${table} WHERE facility_id=$1 ORDER BY id`,
      [facilityId],
    );
    (state as unknown as Record<string, unknown>)[key] = rows.rows.map(
      (r) => r.data,
    );
  }
  return ensureDemoProfiles(
    ensureStructuredCareRecords(ensureMemoryGraph(state)),
  );
}
export async function savePostgres(client: PoolClient, state: Workspace) {
  for (const [key, table] of Object.entries(tables)) {
    const values = state[key as keyof typeof tables] as unknown as {
      id: string;
      residentId?: string;
      recordingId?: string;
    }[];
    for (const item of values) {
      const columns = ["id", "facility_id", "data"];
      const args: unknown[] = [
        item.id,
        state.facility.id,
        JSON.stringify(item),
      ];
      if (
        [
          "recordings",
          "information",
          "care_records",
          "memory_nodes",
          "memory_episodes",
          "memory_edges",
        ].includes(table)
      ) {
        columns.push("resident_id");
        args.push(item.residentId ?? null);
      }
      if (["information", "care_records", "memory_episodes"].includes(table)) {
        columns.push("recording_id");
        args.push(item.recordingId);
      }
      await client.query(
        `INSERT INTO ${table} (${columns.join(",")}) VALUES (${args.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT (facility_id,id) DO UPDATE SET ${columns
          .slice(2)
          .map((c) => `${c}=EXCLUDED.${c}`)
          .join(",")}`,
        args,
      );
    }
    // Audit is append-only. Profile deletion removes the item while preserving action metadata.
    if (
      [
        "information",
        "memory_nodes",
        "memory_episodes",
        "memory_edges",
      ].includes(table)
    )
      await client.query(
        `DELETE FROM ${table} WHERE facility_id=$1 AND NOT (id = ANY($2::text[]))`,
        [state.facility.id, values.map((v) => v.id)],
      );
  }
}
async function localTransaction<T>(
  facilityId: string,
  action: (state: Workspace) => Promise<T> | T,
): Promise<T> {
  if (process.env.NODE_ENV === "production")
    throw new Error("PostgreSQL is required in production.");
  if (facilityId !== "sakura") throw new Error("Unknown facility");
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "workspace.json");
  await mkdir(dir, { recursive: true, mode: 0o700 });
  let state: Workspace;
  try {
    state = ensureDemoProfiles(
      ensureStructuredCareRecords(
        ensureMemoryGraph(JSON.parse(await readFile(file, "utf8"))),
      ),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    state = seedWorkspace();
  }
  const result = await action(state);
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(temporary, file);
  return result;
}
export async function transaction<T>(
  facilityId: string,
  action: (state: Workspace) => Promise<T> | T,
): Promise<T> {
  if (process.env.DATABASE_URL) {
    const client = await pool().connect();
    try {
      await client.query("BEGIN");
      const state = await loadPostgres(client, facilityId);
      const result = await action(state);
      await savePostgres(client, state);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  const task = (globalDb.mimoQueue ?? Promise.resolve()).then(() =>
    localTransaction(facilityId, action),
  );
  globalDb.mimoQueue = task.catch(() => undefined);
  return task;
}
