import { test } from "node:test";
import assert from "node:assert/strict";
import { seedWorkspace } from "../db/seed";
import {
  executeAction,
  familyReportText,
  handoffText,
  expireTranscripts,
} from "../domain/workflow";
import { DemoMnemoNet, generateDraft } from "../domain/mnemonet";
import type { Session } from "../types";
const session: Session = {
  facilityId: "sakura",
  userId: "aoki",
  role: "caregiver",
  expires: Date.now() + 9999999,
};
async function prepared() {
  const state = seedWorkspace();
  const { id } = await executeAction(
    state,
    { type: "transfer", residentId: "tanaka" },
    session,
  );
  for (let i = 0; i < 5; i++)
    await executeAction(state, { type: "process", id }, session);
  return { state, recording: state.recordings.find((r) => r.id === id)! };
}
test("vertical slice requires review, consolidates memory, and discards transcript on approval", async () => {
  const { state, recording: r } = await prepared();
  const before = state.information.length;
  assert.equal(r.status, "review");
  assert.ok(r.transcript.length);
  assert.equal(
    state.information.filter((i) => i.recordingId === r.id).length,
    0,
  );
  await executeAction(
    state,
    {
      type: "review",
      id: r.id,
      revision: r.revision,
      draft: r.draft,
      proposals: r.proposals,
      approve: true,
    },
    session,
  );
  assert.equal(r.status, "completed");
  assert.equal(r.transcript.length, 0);
  assert.ok(state.information.length > before);
  assert.equal(
    state.records.filter((record) => record.recordingId === r.id).length,
    1,
  );
  const interests = state.information.filter(
    (i) =>
      i.residentId === "tanaka" &&
      i.kind === "profile" &&
      i.category === "Interests",
  );
  assert.equal(interests.length, 1);
  assert.match(interests[0].content, /バラ/);
  assert.ok(interests[0].history.length);
  assert.ok(state.audit.some((a) => a.action.includes("Approved")));
  const familyReport = state.handoffs.find(
    (item) => item.kind === "family" && item.recordingId === r.id,
  );
  assert.ok(familyReport);
  assert.match(familyReport.content, /本日のご様子/);
});
test("rejected facts never enter resident memory or generated documentation", async () => {
  const { state, recording: r } = await prepared();
  const proposals = r.proposals.map((p) =>
    p.category === "Sleep" ? { ...p, status: "rejected" as const } : p,
  );
  const draft = generateDraft(proposals);
  assert.doesNotMatch(draft, /眠れ/);
  await executeAction(
    state,
    {
      type: "review",
      id: r.id,
      revision: r.revision,
      proposals,
      draft,
      approve: true,
    },
    session,
  );
  assert.ok(
    !state.information.some(
      (i) => i.recordingId === r.id && i.category === "Sleep",
    ),
  );
  assert.equal(
    r.proposals.find((p) => p.category === "Sleep")?.content,
    "Rejected information removed",
  );
});
test("approval retries are idempotent", async () => {
  const { state, recording: r } = await prepared();
  const input = {
    type: "review" as const,
    id: r.id,
    revision: r.revision,
    proposals: structuredClone(r.proposals),
    draft: r.draft,
    approve: true,
  };
  await executeAction(state, input, session);
  const before = structuredClone(state);
  await executeAction(state, input, session);
  assert.deepEqual(state, before);
});
test("cross-facility and viewer writes are denied", async () => {
  const state = seedWorkspace();
  await assert.rejects(
    executeAction(
      state,
      { type: "transfer", residentId: "tanaka" },
      { ...session, facilityId: "other" },
    ),
    /permission/,
  );
  await assert.rejects(
    executeAction(
      state,
      { type: "transfer", residentId: "tanaka" },
      { ...session, role: "viewer" },
    ),
    /permission/,
  );
});
test("caregivers can add residents while keeping rooms unique", async () => {
  const state = seedWorkspace();
  const result = await executeAction(
    state,
    {
      type: "create-resident",
      name: "高橋 春子",
      kana: "たかはし はるこ",
      age: 87,
      room: "207",
      caregiverId: "aoki",
    },
    session,
  );
  const resident = state.residents.find((r) => r.id === result.id);
  assert.match(result.id, /^resident-/);
  assert.equal(resident?.name, "高橋 春子");
  assert.equal(resident?.room, "207");
  assert.ok(state.audit.some((a) => a.action === "Added resident"));
  await assert.rejects(
    executeAction(
      state,
      {
        type: "create-resident",
        name: "別の方",
        kana: "べつのかた",
        age: 80,
        room: "207",
        caregiverId: "aoki",
      },
      session,
    ),
    /room/,
  );
});
test("family reports use approved resident knowledge and remain editable", async () => {
  const state = seedWorkspace();
  const text = familyReportText(state, "tanaka");
  assert.match(text, /田中 花子/);
  assert.doesNotMatch(text, /佐藤/);
  assert.equal(text.match(/朝食は全量摂取/g)?.length, 1);
  const created = await executeAction(
    state,
    { type: "create-family-report", residentId: "tanaka" },
    session,
  );
  const report = state.handoffs.find((item) => item.id === created.id)!;
  assert.equal(report.kind, "family");
  assert.equal(report.residentId, "tanaka");
  await executeAction(
    state,
    {
      type: "save-family-report",
      id: report.id,
      content: "ご家族様へ\n職員が確認した文面です。",
    },
    session,
  );
  assert.match(report.content, /確認した文面/);
  assert.ok(
    state.audit.some((item) => item.action === "Updated family report"),
  );
});
test("unknown and unassigned residents cannot process; reassignment invalidates draft", async () => {
  const state = seedWorkspace();
  const { id } = await executeAction(
    state,
    { type: "transfer", residentId: null },
    session,
  );
  await assert.rejects(
    executeAction(state, { type: "process", id }, session),
    /Select a resident/,
  );
  await assert.rejects(
    executeAction(
      state,
      { type: "associate", id, residentId: "outside" },
      session,
    ),
    /not found/,
  );
  const ready = await prepared();
  await executeAction(
    ready.state,
    { type: "associate", id: ready.recording.id, residentId: "sato" },
    session,
  );
  assert.equal(ready.recording.stage, 0);
  assert.equal(ready.recording.proposals.length, 0);
  assert.equal(ready.recording.draft, "");
});
test("correcting an automatically matched SD-card recording preserves its transcript", async () => {
  const { state, recording } = await prepared();
  recording.source = "sd-card";
  recording.residentMatch = "automatic";
  const transcript = structuredClone(recording.transcript);
  const proposals = structuredClone(recording.proposals);
  await executeAction(
    state,
    { type: "associate", id: recording.id, residentId: "sato" },
    session,
  );
  assert.equal(recording.residentId, "sato");
  assert.equal(recording.residentMatch, "manual");
  assert.deepEqual(recording.transcript, transcript);
  assert.deepEqual(recording.proposals, proposals);
  assert.equal(recording.status, "review");
});
test("stale reviews and edits do not overwrite other caregivers", async () => {
  const { state, recording: r } = await prepared();
  await assert.rejects(
    executeAction(
      state,
      {
        type: "review",
        id: r.id,
        revision: r.revision - 1,
        proposals: r.proposals,
        draft: r.draft,
        approve: false,
      },
      session,
    ),
    /another window/,
  );
  const item = state.information[0];
  await assert.rejects(
    executeAction(
      state,
      {
        type: "edit-information",
        id: item.id,
        content: "Change",
        updatedAt: "old",
      },
      session,
    ),
    /changed/,
  );
});
test("MnemoNet separates small talk and never diagnoses", async () => {
  const result = await new DemoMnemoNet().extract(
    [
      { speaker: "resident", start: 0, end: 3, text: "今日はいい天気ですね。" },
      { speaker: "resident", start: 4, end: 7, text: "昨夜は眠れなかった。" },
    ],
    [],
  );
  assert.equal(result.proposals.filter((p) => p.kind === "ignored").length, 1);
  assert.equal(result.proposals.filter((p) => p.kind === "care").length, 1);
  assert.doesNotMatch(result.draft, /天気|診断|認知症/);
});
test("expired transcripts clear and handoffs only use approved information", async () => {
  const { state, recording } = await prepared();
  recording.retentionUntil = "2000-01-01";
  expireTranscripts(state);
  assert.equal(recording.transcript.length, 0);
  assert.ok(recording.proposals.every((p) => !p.evidence));
  assert.doesNotMatch(handoffText(state), /昨夜はよく眠れなかった/);
});
test("all rejected review finalizes without manufacturing a care record", async () => {
  const { state, recording: r } = await prepared();
  await executeAction(
    state,
    {
      type: "review",
      id: r.id,
      revision: r.revision,
      draft: "",
      proposals: r.proposals.map((p) => ({ ...p, status: "rejected" })),
      approve: true,
    },
    session,
  );
  assert.equal(r.status, "completed");
  assert.equal(
    state.records.filter((record) => record.recordingId === r.id).length,
    0,
  );
  assert.equal(
    state.information.filter((i) => i.recordingId === r.id).length,
    0,
  );
});
