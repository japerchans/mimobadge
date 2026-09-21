import { test } from "node:test";
import assert from "node:assert/strict";
import { moodTimeline } from "../domain/mood";
import { seedWorkspace } from "../db/seed";

test("mood timeline uses observed current and historical statements", () => {
  const state = seedWorkspace();
  const item = state.information.find(
    (candidate) => candidate.residentId === "tanaka",
  )!;
  item.category = "Mood";
  item.content = "昔の学校の話をされ、笑顔が見られた。";
  item.history = [
    {
      content: "娘の訪問を心配され、不安な表情が見られた。",
      date: "2026-09-01T10:00:00.000Z",
      source: "older-recording",
    },
  ];
  const points = moodTimeline(state.information, "tanaka");
  assert.ok(points.some((point) => point.label === "明るい様子"));
  assert.ok(points.some((point) => point.label === "不安な様子"));
  assert.ok(points.every((point) => point.content.length > 0));
});
