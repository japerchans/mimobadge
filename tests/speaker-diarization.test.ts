import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assignSpeakerRoles,
  labeledTranscript,
  parseDiarizedSegments,
} from "../domain/speaker-diarization";

test("opening resident introduction identifies the caregiver speaker", () => {
  const segments = parseDiarizedSegments([
    { speaker: "B", start: 0, end: 3, text: "田中さんです。朝ですよ。" },
    { speaker: "A", start: 3, end: 7, text: "おはようございます。" },
    { speaker: "B", start: 7, end: 10, text: "よく眠れましたか？" },
  ]);
  assert.deepEqual(
    assignSpeakerRoles(segments, "田中 花子").map((segment) => segment.speaker),
    ["caregiver", "resident", "caregiver"],
  );
});

test("explicit role mapping preserves diarized timestamps and unknown speakers", () => {
  const segments = parseDiarizedSegments([
    { speaker: "chunk-0-A", start: 1.2, end: 4.5, text: "失礼します。" },
    { speaker: "chunk-0-B", start: 4.5, end: 8, text: "どうぞ。" },
    { speaker: "chunk-1-C", start: 8, end: 9, text: "こんにちは。" },
  ]);
  const mapped = assignSpeakerRoles(segments, "田中 花子", {
    "chunk-0-A": "caregiver",
    "chunk-0-B": "resident",
    "chunk-1-C": "unknown",
  });
  assert.deepEqual(
    mapped.map(({ speaker, start, end }) => ({ speaker, start, end })),
    [
      { speaker: "caregiver", start: 1.2, end: 4.5 },
      { speaker: "resident", start: 4.5, end: 8 },
      { speaker: "unknown", start: 8, end: 9 },
    ],
  );
  assert.match(labeledTranscript(segments), /\[話者 chunk-0-A 00:01\]/);
});

test("invalid provider segments are discarded", () => {
  assert.deepEqual(
    parseDiarizedSegments([
      { speaker: "A", start: 0, end: 2, text: "  " },
      { speaker: "", start: 0, end: 2, text: "本文" },
      { speaker: "B", start: 2, end: 4, text: "有効" },
    ]),
    [{ speaker: "B", start: 2, end: 4, text: "有効" }],
  );
});
