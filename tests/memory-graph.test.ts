import { test } from "node:test";
import assert from "node:assert/strict";
import { seedWorkspace } from "../db/seed";
import {
  buildMemoryGraph,
  calculateMemoryGraphMetrics,
  memoryGraphForResident,
} from "../domain/memory-graph";
import { executeAction } from "../domain/workflow";
import type { Information, Session } from "../types";

const session: Session = {
  facilityId: "sakura",
  userId: "aoki",
  role: "caregiver",
  expires: Date.now() + 100000,
};

test("approved autobiographical information becomes a small typed co-occurrence graph", () => {
  const graph = memoryGraphForResident(seedWorkspace(), "tanaka");
  assert.ok(
    graph.nodes.some((node) => node.type === "person" && node.label === "娘"),
  );
  assert.ok(
    graph.nodes.some(
      (node) => node.type === "place" && node.label === "小学校",
    ),
  );
  assert.ok(
    graph.nodes.some((node) => node.type === "time" && node.label === "週末"),
  );
  assert.ok(graph.nodes.some((node) => node.type === "event"));
  assert.ok(graph.edges.length > 0);
  assert.equal(graph.metrics.nodeCount, graph.nodes.length);
  assert.ok(graph.metrics.largestConnectedComponent > 1);
  assert.ok(graph.metrics.nodeTypeDiversity > 0);
});

test("care observations never enter the autobiographical graph", () => {
  const item: Information = {
    id: "care-only",
    residentId: "tanaka",
    recordingId: "recording",
    kind: "care",
    category: "Sleep",
    content: "昨夜は眠れなかった。娘に話した。",
    evidence: "昨夜は眠れなかった。娘に話した。",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    approvedBy: "aoki",
    status: "approved",
    history: [],
  };
  assert.deepEqual(buildMemoryGraph([item]), {
    memoryNodes: [],
    memoryEpisodes: [],
    memoryEdges: [],
  });
});

test("editing and deleting approved information rebuilds the graph without stale nodes", async () => {
  const state = seedWorkspace();
  const item = state.information.find(
    (candidate) =>
      candidate.residentId === "tanaka" &&
      candidate.kind === "profile" &&
      candidate.content.includes("娘"),
  )!;
  const oldNodeId = state.memoryNodes.find(
    (node) => node.residentId === "tanaka" && node.label === "娘",
  )!.id;
  await executeAction(
    state,
    {
      type: "edit-information",
      id: item.id,
      content: "息子が週末に訪問する。",
      updatedAt: item.updatedAt,
    },
    session,
  );
  assert.ok(!state.memoryNodes.some((node) => node.id === oldNodeId));
  assert.ok(
    state.memoryNodes.some(
      (node) => node.residentId === "tanaka" && node.label === "息子",
    ),
  );
  await executeAction(
    state,
    { type: "delete-information", id: item.id, updatedAt: item.updatedAt },
    session,
  );
  assert.ok(
    !state.memoryNodes.some(
      (node) => node.residentId === "tanaka" && node.label === "息子",
    ),
  );
});

test("empty metric calculation is stable", () => {
  assert.deepEqual(calculateMemoryGraphMetrics([], []), {
    nodeCount: 0,
    edgeCount: 0,
    largestConnectedComponent: 0,
    averageDegree: 0,
    nodeTypeDiversity: 0,
    nodesByType: { person: 0, place: 0, event: 0, time: 0 },
  });
});
