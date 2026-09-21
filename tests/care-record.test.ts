import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStructuredCareRecord,
  ensureStructuredCareRecords,
} from "../domain/care-record";
import { seedWorkspace } from "../db/seed";
import type { Proposal, StructuredCareRecord } from "../types";

const proposal = (
  id: string,
  content: string,
  recordField: Proposal["recordField"],
  category = "Observation",
): Proposal => ({
  id,
  kind: "care",
  category,
  content,
  evidence: content,
  status: "approved",
  recordField,
});

test("care records separate F-SOAIP facts and extract routine measurements", () => {
  const record = buildStructuredCareRecord([
    proposal(
      "s",
      "本人より「右膝が痛い」との訴えあり。",
      "subjective",
      "Pain or discomfort",
    ),
    proposal(
      "o",
      "体温36.7度、血圧128/76。朝食は8割摂取。",
      "objective",
      "Vitals",
    ),
    proposal("i", "歩行時に見守りを実施した。", "intervention", "Assistance"),
    proposal("p", "右膝の様子を次勤務者へ申し送る。", "plan"),
  ]);
  assert.deepEqual(record.subjective, ["本人より「右膝が痛い」との訴えあり。"]);
  assert.equal(record.intervention.length, 1);
  assert.equal(record.plan.length, 1);
  assert.deepEqual(
    record.measurements.map((item) => item.value),
    ["128/76 mmHg", "36.7 ℃", "80 %"],
  );
});

test("legacy records gain a structured view from approved information", () => {
  const state = seedWorkspace();
  assert.equal(state.records[0].structured, undefined);
  ensureStructuredCareRecords(state);
  const structured = state.records[0].structured as
    StructuredCareRecord | undefined;
  assert.equal(structured?.format, "F-SOAIP");
  assert.ok(structured?.objective.length || structured?.subjective.length);
});
