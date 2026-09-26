import assert from "node:assert/strict";
import test from "node:test";
import {
  careRecordExportCsv,
  careRecordExportText,
  careRecordExportWisemanCsv,
} from "../components/care-record-export";
import type { Caregiver, Resident } from "../types";
import type { DailyCareRecord } from "../components/daily-care-records";

const resident: Resident = {
  id: "resident-1",
  name: "田中 花子",
  kana: "たなか はなこ",
  age: 86,
  room: "201",
  caregiverId: "aoki",
  since: "2024-04-01",
  initials: "TH",
};

const caregiver: Caregiver = {
  id: "aoki",
  name: "青木 美咲",
  role: "caregiver",
  badge: "MB-01",
  shift: "day",
};

const day: DailyCareRecord = {
  id: "resident-1:2026-09-23",
  residentId: "resident-1",
  date: "2026-09-23",
  createdAt: "2026-09-23T02:00:00.000Z",
  approvedBy: "aoki",
  content: "朝食は全量摂取。右膝痛の訴えあり。",
  records: [
    {
      id: "record-1",
      residentId: "resident-1",
      recordingId: "rec-1",
      content: "朝食は全量摂取。",
      createdAt: "2026-09-23T00:15:00.000Z",
      approvedBy: "aoki",
    },
    {
      id: "record-2",
      residentId: "resident-1",
      recordingId: "rec-2",
      content: "右膝痛の訴えあり。",
      createdAt: "2026-09-23T02:00:00.000Z",
      approvedBy: "aoki",
    },
  ],
  structured: {
    format: "F-SOAIP",
    focus: ["食事", "疼痛"],
    subjective: ["右膝が少し痛い。"],
    objective: ["朝食は全量摂取。"],
    assessment: ["移動時の疼痛に注意。"],
    intervention: ["右側から声かけし、手すり使用を案内。"],
    plan: ["次回も右膝痛を確認。"],
    measurements: [
      { kind: "meal", label: "食事", value: "100 %" },
      { kind: "temperature", label: "体温", value: "36.5 ℃" },
      { kind: "blood-pressure", label: "血圧", value: "128/72 mmHg" },
    ],
  },
};

test("exports care records as readable text", () => {
  const text = careRecordExportText({ day, resident, caregiver });
  assert.match(text, /介護記録/);
  assert.match(text, /田中 花子/);
  assert.match(text, /F｜着眼点/);
  assert.match(text, /朝食は全量摂取/);
});

test("exports generic csv with stable headers", () => {
  const csv = careRecordExportCsv({ day, resident, caregiver });
  assert.match(csv, /^記録日,利用者ID,利用者名,居室/);
  assert.match(csv, /2026-09-23,resident-1,田中 花子,201/);
  assert.match(csv, /rec-1 rec-2/);
});

test("exports wiseman-compatible csv columns for import mapping", () => {
  const csv = careRecordExportWisemanCsv({ day, resident, caregiver });
  assert.match(csv, /^利用者コード,利用者氏名,居室,記録日,開始時刻,終了時刻,記録種別/);
  assert.match(csv, /日常介護記録/);
  assert.match(csv, /128\/72 mmHg/);
  assert.match(csv, /こころん/);
});
