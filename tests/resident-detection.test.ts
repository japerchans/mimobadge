import { test } from "node:test";
import assert from "node:assert/strict";
import { seedWorkspace } from "../db/seed";
import { detectResidentFromIntroduction } from "../domain/resident-detection";

const residents = seedWorkspace().residents;

test("detects a unique resident from an explicit spoken introduction", () => {
  assert.equal(
    detectResidentFromIntroduction(
      "これから始めます。田中花子さんです。今日はよく晴れましたね。",
      residents,
    )?.id,
    "tanaka",
  );
  assert.equal(
    detectResidentFromIntroduction(
      "本日の入居者は、たなかさんです。よろしくお願いします。",
      residents,
    )?.id,
    "tanaka",
  );
});

test("does not infer identity from an ordinary mention", () => {
  assert.equal(
    detectResidentFromIntroduction(
      "今日は田中さんは元気に過ごされています。",
      residents,
    ),
    null,
  );
});

test("rejects ambiguous introductions instead of guessing", () => {
  const duplicateSurname = {
    ...residents[0],
    id: "tanaka-2",
    name: "田中 一郎",
    kana: "たなか いちろう",
    room: "301",
  };
  assert.equal(
    detectResidentFromIntroduction("田中さんです。", [
      ...residents,
      duplicateSurname,
    ]),
    null,
  );
  assert.equal(
    detectResidentFromIntroduction(
      "田中さんです。続いて佐藤さんです。",
      residents,
    ),
    null,
  );
});

test("only looks near the beginning of the recording", () => {
  assert.equal(
    detectResidentFromIntroduction(
      `${"本日の記録を開始します。".repeat(30)}田中さんです。`,
      residents,
    ),
    null,
  );
});
