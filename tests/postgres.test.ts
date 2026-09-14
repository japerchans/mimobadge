import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import type { PoolClient } from "pg";
import { savePostgres } from "../db/repository";
import { seedWorkspace } from "../db/seed";
import { executeAction } from "../domain/workflow";
// PGlite runs real PostgreSQL in-process; no Docker daemon is needed for schema tests.
test("PostgreSQL schema persists approval atomically, enforces facility foreign keys and supports deletion", async () => {
  const db = new PGlite();
  try {
    await db.exec(await readFile("db/schema.sql", "utf8"));
    await db.query(
      "INSERT INTO facilities (id,name) VALUES ('sakura','Sakura Care Home')",
    );
    const state = seedWorkspace();
    await savePostgres(db as unknown as PoolClient, state);
    assert.equal((await db.query("SELECT * FROM residents")).rows.length, 5);
    const session = {
      facilityId: "sakura",
      userId: "aoki",
      role: "caregiver" as const,
      expires: Date.now() + 100000,
    };
    const { id } = await executeAction(
      state,
      { type: "transfer", residentId: "tanaka" },
      session,
    );
    for (let i = 0; i < 5; i++)
      await executeAction(state, { type: "process", id }, session);
    const recording = state.recordings.find((r) => r.id === id)!;
    await executeAction(
      state,
      {
        type: "review",
        id,
        revision: recording.revision,
        proposals: recording.proposals,
        draft: recording.draft,
        approve: true,
      },
      session,
    );
    await db.exec("BEGIN");
    await savePostgres(db as unknown as PoolClient, state);
    await db.exec("COMMIT");
    const records = await db.query(
      "SELECT data FROM care_records WHERE facility_id=$1 AND recording_id=$2",
      ["sakura", id],
    );
    assert.equal(records.rows.length, 1);
    await assert.rejects(
      db.query(
        "INSERT INTO information(id,facility_id,resident_id,recording_id,data) VALUES('bad','sakura','other-facility-person',$1,'{}')",
        [id],
      ),
      /foreign key/,
    );
    const removed = state.information[0];
    state.information = state.information.filter((i) => i.id !== removed.id);
    await savePostgres(db as unknown as PoolClient, state);
    assert.equal(
      (await db.query("SELECT * FROM information WHERE id=$1", [removed.id]))
        .rows.length,
      0,
    );
    await db.exec("BEGIN");
    await db.query(
      "UPDATE facilities SET name='Should roll back' WHERE id='sakura'",
    );
    await db.exec("ROLLBACK");
    assert.equal(
      (
        await db.query<{ name: string }>(
          "SELECT name FROM facilities WHERE id='sakura'",
        )
      ).rows[0].name,
      "Sakura Care Home",
    );
  } finally {
    await db.close();
  }
});
