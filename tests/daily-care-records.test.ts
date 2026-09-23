import assert from "node:assert/strict";
import test from "node:test";
import { groupDailyCareRecords } from "../components/daily-care-records";
import type { CareRecord } from "../types";

test("groups care records into one daily report per resident and date", () => {
  const records: CareRecord[] = [
    {
      id: "morning",
      residentId: "tanaka",
      recordingId: "rec-1",
      content: "朝食は全量摂取。",
      createdAt: "2026-09-23T00:15:00.000Z",
      approvedBy: "aoki",
      structured: {
        format: "F-SOAIP",
        focus: ["Meals"],
        subjective: [],
        objective: ["朝食は全量摂取。"],
        assessment: [],
        intervention: [],
        plan: [],
        measurements: [{ kind: "meal", label: "食事", value: "朝食 100%" }],
      },
    },
    {
      id: "afternoon",
      residentId: "tanaka",
      recordingId: "rec-2",
      content: "午後は右膝痛の訴えあり。",
      createdAt: "2026-09-23T05:30:00.000Z",
      approvedBy: "aoki",
      structured: {
        format: "F-SOAIP",
        focus: ["Pain"],
        subjective: ["右膝が少し痛む。"],
        objective: [],
        assessment: ["移動時は見守りを継続。"],
        intervention: ["右側から声かけ。"],
        plan: ["次回も疼痛確認。"],
        measurements: [],
      },
    },
    {
      id: "other-resident",
      residentId: "sato",
      recordingId: "rec-3",
      content: "穏やかに過ごされた。",
      createdAt: "2026-09-23T02:00:00.000Z",
      approvedBy: "ito",
    },
  ];

  const grouped = groupDailyCareRecords(records);
  const tanaka = grouped.find((item) => item.residentId === "tanaka");

  assert.equal(grouped.length, 2);
  assert.equal(tanaka?.records.length, 2);
  assert.match(tanaka?.content || "", /朝食は全量摂取/);
  assert.match(tanaka?.content || "", /右膝痛/);
  assert.deepEqual(tanaka?.structured?.focus, ["Meals", "Pain"]);
  assert.equal(tanaka?.structured?.measurements[0].value, "朝食 100%");
});
