import { buildMemoryGraph } from "@/domain/memory-graph";
import type { Information, Resident, Workspace } from "@/types";

const fallbackKentaroId = "kobayashi-kentaro";
const requestedKentaroId = "resident-b4766625";

const date = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

const normalize = (value: string) => value.replace(/[\s　]/g, "");

function findKentaro(state: Workspace) {
  return (
    state.residents.find((resident) => resident.id === requestedKentaroId) ||
    state.residents.find(
      (resident) =>
        resident.room === "211" && normalize(resident.name) === "小林健太郎",
    ) ||
    state.residents.find(
      (resident) => normalize(resident.name) === "小林健太郎",
    ) ||
    state.residents.find((resident) => resident.id === fallbackKentaroId)
  );
}

function ensureKentaroResident(state: Workspace): Resident {
  const existing = findKentaro(state);
  if (existing) {
    existing.name = "小林 健太郎";
    existing.kana = "こばやし けんたろう";
    existing.room = existing.room || "211";
    existing.initials = "健";
    return existing;
  }
  const created = {
    id: fallbackKentaroId,
    name: "小林 健太郎",
    kana: "こばやし けんたろう",
    age: 82,
    room: "211",
    caregiverId: "ito",
    since: "2024-09-02",
    initials: "健",
  };
  state.residents.push(created);
  return created;
}

function removeWrongKentaro(state: Workspace, targetId: string) {
  const wrongIds = new Set(
    state.residents
      .filter(
        (resident) =>
          resident.id !== targetId && normalize(resident.name) === "小林賢太郎",
      )
      .map((resident) => resident.id),
  );
  state.residents = state.residents.filter(
    (resident, index, all) =>
      normalize(resident.name) !== "小林賢太郎" &&
      all.findIndex((candidate) => candidate.id === resident.id) === index,
  );
  state.information = state.information.filter(
    (item) => !item.id.startsWith("profile-kobayashi-kentaro-"),
  );
  if (!wrongIds.size) return;
  state.recordings = state.recordings.filter(
    (recording) => !wrongIds.has(recording.residentId || ""),
  );
  state.information = state.information.filter(
    (item) => !wrongIds.has(item.residentId),
  );
  state.records = state.records.filter(
    (record) => !wrongIds.has(record.residentId),
  );
  state.handoffs = state.handoffs.filter(
    (handoff) => !handoff.residentId || !wrongIds.has(handoff.residentId),
  );
}

function ensureRecording(
  state: Workspace,
  resident: Resident,
  suffix: string,
  days: number,
  hour: number,
) {
  const id = `history-${resident.id}-${suffix}`;
  if (!state.recordings.some((recording) => recording.id === id))
    state.recordings.push({
      id,
      residentId: resident.id,
      caregiverId: resident.caregiverId || "ito",
      createdAt: date(days, hour),
      duration: suffix === "0" ? 240 : suffix === "3" ? 185 : 210,
      status: "completed",
      stage: 5,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: date(-1),
      revision: 1,
    });
  return id;
}

function ensureInformation(
  state: Workspace,
  item: Omit<Information, "status" | "history">,
) {
  const existing = state.information.find(
    (candidate) => candidate.id === item.id,
  );
  if (existing) {
    Object.assign(existing, item);
    return;
  }
  state.information.push({
    ...item,
    status: "approved",
    history: [],
  });
}

export function ensureDemoProfiles(state: Workspace): Workspace {
  const resident = ensureKentaroResident(state);
  removeWrongKentaro(state, resident.id);

  const rec14 = ensureRecording(state, resident, "14", 14, 9);
  const rec3 = ensureRecording(state, resident, "3", 3, 14);
  const rec0 = ensureRecording(state, resident, "0", 0, 10);
  const caregiverId = resident.caregiverId || "ito";

  const care = [
    {
      id: `care-${rec14}`,
      recordingId: rec14,
      category: "Observation",
      content: "昼食後、窓際で穏やかに過ごされた。",
      evidence: "昼食後は窓際の席で、外を見ながら穏やかに過ごされた。",
      createdAt: date(14, 9),
    },
    {
      id: `care-${rec3}`,
      recordingId: rec3,
      category: "Activity",
      content: "午後の体操に参加され、終了後に水分を150mL摂取された。",
      evidence: "体操に参加。終わったあと水を150mL飲まれた。",
      createdAt: date(3, 14),
    },
    {
      id: `care-${rec0}`,
      recordingId: rec0,
      category: "Mood",
      content:
        "午前中、浅草の落語会の思い出を話され、笑顔が多く見られた。",
      evidence: "浅草で落語を見た話をされ、何度か笑顔が見られた。",
      createdAt: date(0, 10),
    },
  ];

  for (const item of care) {
    ensureInformation(state, {
      ...item,
      residentId: resident.id,
      kind: "care",
      updatedAt: item.createdAt,
      approvedBy: caregiverId,
    });
    if (
      !state.records.some(
        (record) => record.id === `record-${item.recordingId}`,
      )
    )
      state.records.push({
        id: `record-${item.recordingId}`,
        residentId: resident.id,
        recordingId: item.recordingId,
        content: item.content,
        createdAt: item.createdAt,
        approvedBy: caregiverId,
      });
  }

  const profile = [
    {
      id: `profile-${resident.id}-occupation`,
      recordingId: rec14,
      category: "Former occupation",
      content: "浅草の和菓子店で長く働いていた。",
      evidence: "浅草の和菓子店で働いていた頃の話をされた。",
      createdAt: date(14, 9),
    },
    {
      id: `profile-${resident.id}-interests`,
      recordingId: rec14,
      category: "Interests",
      content: "落語と散歩が好き。",
      evidence: "落語を聞くのが好きで、天気の良い日は散歩を楽しみにされる。",
      createdAt: date(14, 9),
    },
    {
      id: `profile-${resident.id}-family`,
      recordingId: rec3,
      category: "Family",
      content: "長男家族が月に一度面会に来る。",
      evidence: "長男と孫が来る日を楽しみにしていると話された。",
      createdAt: date(3, 14),
    },
    {
      id: `profile-${resident.id}-care-preferences`,
      recordingId: rec0,
      category: "Care preferences",
      content: "急かされると不安になりやすく、予定を先に伝えると落ち着く。",
      evidence: "次の予定を先に伝えると安心される様子があった。",
      createdAt: date(0, 10),
    },
    {
      id: `profile-${resident.id}-communication`,
      recordingId: rec0,
      category: "Communication",
      content: "冗談を交えた会話を好み、昔の浅草の話題で表情が和らぐ。",
      evidence: "浅草の話や冗談に笑顔で応じられた。",
      createdAt: date(0, 10),
    },
  ];

  for (const item of profile)
    ensureInformation(state, {
      ...item,
      residentId: resident.id,
      kind: "profile",
      updatedAt: item.createdAt,
      approvedBy: caregiverId,
    });

  const graph = buildMemoryGraph(state.information);
  state.memoryNodes = graph.memoryNodes;
  state.memoryEpisodes = graph.memoryEpisodes;
  state.memoryEdges = graph.memoryEdges;
  return state;
}
