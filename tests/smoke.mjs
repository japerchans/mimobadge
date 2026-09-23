import assert from "node:assert/strict";
const base = "http://127.0.0.1:3000";
async function state() {
  const response = await fetch(`${base}/api/workspace`);
  assert.equal(response.status, 200);
  return response.json();
}
async function action(input) {
  const response = await fetch(`${base}/api/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify(input),
  });
  const result = await response.json();
  assert.equal(response.status, 200, result.error);
  return result;
}
const initial = await state();
assert.equal(initial.residents.length, 6);
const { id } = await action({ type: "transfer", residentId: "tanaka" });
for (let i = 0; i < 5; i++) await action({ type: "process", id });
const review = (await state()).recordings.find((r) => r.id === id);
assert.equal(review.status, "review");
assert.equal(review.proposals.filter((p) => p.kind === "ignored").length, 1);
const proposals = review.proposals.map((p) =>
  p.category === "Sleep" ? { ...p, status: "rejected" } : p,
);
const draft = proposals
  .filter((p) => p.kind === "care" && p.status !== "rejected")
  .map((p) => p.content)
  .join(" ");
await action({
  type: "review",
  id,
  revision: review.revision,
  proposals,
  draft,
  approve: true,
});
const final = await state();
assert.equal(final.recordings.find((r) => r.id === id).status, "completed");
assert.equal(final.recordings.find((r) => r.id === id).transcript.length, 0);
assert.ok(
  final.information.some(
    (i) => i.recordingId === id && i.category === "Interests",
  ),
);
assert.ok(
  !final.information.some(
    (i) => i.recordingId === id && i.category === "Sleep",
  ),
);
assert.equal(final.records.filter((r) => r.recordingId === id).length, 1);
await action({ type: "handoff" });
assert.ok((await state()).handoffs.length);
for (const route of [
  "/",
  `/processing/${id}`,
  "/residents/tanaka",
  "/records",
  "/handoffs",
  "/staff",
  "/settings",
]) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200, route);
}
const denied = await fetch(`${base}/api/actions`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "https://example.com",
  },
  body: JSON.stringify({ type: "transfer", residentId: "tanaka" }),
});
assert.equal(denied.status, 403);
console.log(
  "HTTP smoke passed: transfer → process → exclude → approve → resident update → handoff; all routes 200; cross-origin write denied.",
);
