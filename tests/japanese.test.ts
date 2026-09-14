import { test } from "node:test";
import assert from "node:assert/strict";
import { ja, jaHandoff } from "../lib/ja";
import { seedWorkspace } from "../db/seed";
import { handoffText } from "../domain/workflow";
test("seed profile categories, staff roles, and reading names have Japanese labels", () => {
  const state = seedWorkspace();
  for (const i of state.information)
    assert.match(ja(i.category), /[ぁ-んァ-ン一-龯]/);
  for (const r of state.residents) assert.match(ja(r.kana), /[ぁ-ん]/);
  for (const c of state.caregivers) assert.match(ja(c.role), /[一-龯]/);
});
test("handoff exports use Japanese headings and older saved handoffs can still be displayed", () => {
  const current = handoffText(seedWorkspace());
  assert.match(current, /今日の記録/);
  assert.match(current, /対応の参考/);
  assert.doesNotMatch(current, /Room|Today|Useful context/);
  assert.equal(
    jaHandoff("田中 花子 · Room 201\nToday\nUseful context"),
    "田中 花子 · 201号室\n今日の記録\n対応の参考",
  );
});
test("source labels and user-facing validation messages stay understandable in Japanese", () => {
  assert.equal(ja("Interests: 園芸が好き。"), "好きなこと：園芸が好き。");
  assert.match(
    ja("This review changed in another window. Reload before saving."),
    /再読み込み/,
  );
  assert.match(
    ja("Invalid access code, or login is not configured."),
    /アクセスコード/,
  );
});
