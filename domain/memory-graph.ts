import { createHash } from "node:crypto";
import type {
  Information,
  MemoryEdge,
  MemoryEpisode,
  MemoryGraphMetrics,
  MemoryNode,
  MemoryNodeType,
  Workspace,
} from "@/types";

type Entity = { type: MemoryNodeType; label: string };

const dictionaries: {
  type: Exclude<MemoryNodeType, "event">;
  values: string[];
}[] = [
  {
    type: "person",
    values: [
      "娘",
      "息子",
      "夫",
      "妻",
      "孫",
      "母",
      "父",
      "姉",
      "兄",
      "妹",
      "弟",
      "家族",
      "生徒",
      "友人",
    ],
  },
  {
    type: "place",
    values: [
      "小学校",
      "中学校",
      "高校",
      "大学",
      "学校",
      "鉄道会社",
      "写真館",
      "喫茶店",
      "病院",
      "公園",
      "自宅",
      "東京",
      "横浜",
    ],
  },
  {
    type: "time",
    values: [
      "子どもの頃",
      "学生時代",
      "若い頃",
      "戦後",
      "昔",
      "春",
      "夏",
      "秋",
      "冬",
      "週末",
      "朝",
      "午後",
    ],
  },
];

const normalize = (value: string) =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s、。,.・]/g, "");
const stableId = (prefix: string, value: string) =>
  `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 20)}`;

/** A deliberately conservative extractor. It only structures text a caregiver approved. */
export function extractMemoryEntities(item: Information): Entity[] {
  if (item.kind !== "profile") return [];
  const entities: Entity[] = [{ type: "event", label: item.content }];
  for (const dictionary of dictionaries)
    for (const value of dictionary.values)
      if (item.content.includes(value))
        entities.push({ type: dictionary.type, label: value });
  for (const match of item.content.matchAll(/(?:19|20)\d{2}年|\d{1,2}月/g))
    entities.push({ type: "time", label: match[0] });
  return entities.filter(
    (entity, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.type === entity.type &&
          normalize(candidate.label) === normalize(entity.label),
      ) === index,
  );
}

export function buildMemoryGraph(information: Information[]) {
  const nodes = new Map<string, MemoryNode>();
  const edges = new Map<string, MemoryEdge>();
  const episodes: MemoryEpisode[] = [];
  const groups = new Map<string, Information[]>();
  for (const item of information.filter(
    (candidate) => candidate.kind === "profile",
  )) {
    const key = `${item.residentId}\u0000${item.recordingId}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  for (const items of groups.values()) {
    const first = items[0];
    const episodeId = stableId(
      "episode",
      `${first.residentId}:${first.recordingId}`,
    );
    const episodeNodeIds = new Set<string>();
    for (const item of items) {
      for (const entity of extractMemoryEntities(item)) {
        const normalizedLabel = normalize(entity.label);
        const id = stableId(
          "node",
          `${item.residentId}:${entity.type}:${normalizedLabel}`,
        );
        const existing = nodes.get(id);
        if (existing) {
          existing.lastSeenAt =
            item.updatedAt > existing.lastSeenAt
              ? item.updatedAt
              : existing.lastSeenAt;
          existing.firstSeenAt =
            item.createdAt < existing.firstSeenAt
              ? item.createdAt
              : existing.firstSeenAt;
          existing.mentionCount++;
          if (!existing.episodeIds.includes(episodeId))
            existing.episodeIds.push(episodeId);
        } else {
          nodes.set(id, {
            id,
            residentId: item.residentId,
            type: entity.type,
            label: entity.label,
            normalizedLabel,
            firstSeenAt: item.createdAt,
            lastSeenAt: item.updatedAt,
            mentionCount: 1,
            episodeIds: [episodeId],
          });
        }
        episodeNodeIds.add(id);
      }
    }
    const nodeIds = [...episodeNodeIds].sort();
    episodes.push({
      id: episodeId,
      residentId: first.residentId,
      recordingId: first.recordingId,
      summary: items.map((item) => item.content).join(" "),
      sourceExcerpt: items
        .map((item) => item.evidence)
        .filter(Boolean)
        .join(" "),
      createdAt: items.map((item) => item.createdAt).sort()[0],
      approvedBy: items.toSorted((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )[0].approvedBy,
      nodeIds,
    });
    for (let i = 0; i < nodeIds.length; i++)
      for (let j = i + 1; j < nodeIds.length; j++) {
        const sourceNodeId = nodeIds[i];
        const targetNodeId = nodeIds[j];
        const id = stableId(
          "edge",
          `${first.residentId}:${sourceNodeId}:${targetNodeId}`,
        );
        const timestamp = items.map((item) => item.updatedAt).sort()[0];
        const existing = edges.get(id);
        if (existing) {
          existing.weight++;
          existing.episodeIds.push(episodeId);
          existing.lastSeenAt =
            timestamp > existing.lastSeenAt ? timestamp : existing.lastSeenAt;
        } else
          edges.set(id, {
            id,
            residentId: first.residentId,
            sourceNodeId,
            targetNodeId,
            weight: 1,
            episodeIds: [episodeId],
            firstSeenAt: timestamp,
            lastSeenAt: timestamp,
          });
      }
  }
  return {
    memoryNodes: [...nodes.values()],
    memoryEpisodes: episodes,
    memoryEdges: [...edges.values()],
  };
}

export function rebuildMemoryGraph(state: Workspace) {
  Object.assign(state, buildMemoryGraph(state.information));
}

export function ensureMemoryGraph(state: Workspace) {
  if (
    !Array.isArray(state.memoryNodes) ||
    !Array.isArray(state.memoryEpisodes) ||
    !Array.isArray(state.memoryEdges)
  )
    rebuildMemoryGraph(state);
  return state;
}

export function memoryGraphForResident(state: Workspace, residentId: string) {
  const nodes = state.memoryNodes.filter(
    (node) => node.residentId === residentId,
  );
  const edges = state.memoryEdges.filter(
    (edge) => edge.residentId === residentId,
  );
  const episodes = state.memoryEpisodes.filter(
    (episode) => episode.residentId === residentId,
  );
  return {
    nodes,
    edges,
    episodes,
    metrics: calculateMemoryGraphMetrics(nodes, edges),
  };
}

export function calculateMemoryGraphMetrics(
  nodes: MemoryNode[],
  edges: MemoryEdge[],
): MemoryGraphMetrics {
  const nodesByType: MemoryGraphMetrics["nodesByType"] = {
    person: 0,
    place: 0,
    event: 0,
    time: 0,
  };
  for (const node of nodes) nodesByType[node.type]++;
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    adjacency.get(edge.sourceNodeId)?.add(edge.targetNodeId);
    adjacency.get(edge.targetNodeId)?.add(edge.sourceNodeId);
  }
  let largestConnectedComponent = 0;
  const visited = new Set<string>();
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const queue = [node.id];
    visited.add(node.id);
    let size = 0;
    while (queue.length) {
      const current = queue.shift()!;
      size++;
      for (const neighbor of adjacency.get(current) ?? [])
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
    }
    largestConnectedComponent = Math.max(largestConnectedComponent, size);
  }
  const proportions = Object.values(nodesByType)
    .filter(Boolean)
    .map((count) => count / Math.max(nodes.length, 1));
  const entropy = -proportions.reduce((sum, p) => sum + p * Math.log(p), 0);
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    largestConnectedComponent,
    averageDegree: nodes.length
      ? Number(((2 * edges.length) / nodes.length).toFixed(3))
      : 0,
    nodeTypeDiversity:
      proportions.length > 1 ? Number((entropy / Math.log(4)).toFixed(3)) : 0,
    nodesByType,
  };
}
