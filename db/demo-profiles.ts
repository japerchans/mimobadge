import { buildMemoryGraph } from "@/domain/memory-graph";
import type { Information, Recording, Workspace } from "@/types";

const date = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};

const kentaroId = "kobayashi-kentaro";

export function ensureDemoProfiles(state: Workspace): Workspace {
  if (state.residents.some((resident) => resident.id === kentaroId))
    return state;

  state.residents.push({
    id: kentaroId,
    name: "小林 賢太郎",
    kana: "こばやし けんたろう",
    age: 82,
    room: "208",
    caregiverId: "ito",
    since: "2024-09-02",
    initials: "賢",
  });

  const recordings: Recording[] = [
    {
      id: "history-kobayashi-kentaro-14",
      residentId: kentaroId,
      caregiverId: "ito",
      createdAt: date(14, 9),
      duration: 210,
      status: "completed",
      stage: 5,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: date(-1),
      revision: 1,
    },
    {
      id: "history-kobayashi-kentaro-3",
      residentId: kentaroId,
      caregiverId: "ito",
      createdAt: date(3, 14),
      duration: 185,
      status: "completed",
      stage: 5,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: date(-1),
      revision: 1,
    },
    {
      id: "history-kobayashi-kentaro-0",
      residentId: kentaroId,
      caregiverId: "ito",
      createdAt: date(0, 10),
      duration: 240,
      status: "completed",
      stage: 5,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: date(-1),
      revision: 1,
    },
  ];
  state.recordings.push(...recordings);

  const care: Information[] = [
    {
      id: "care-history-kobayashi-kentaro-14",
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-14",
      kind: "care",
      category: "Observation",
      content: "昼食後、窓際で穏やかに過ごされた。",
      evidence: "昼食後は窓際の席で、外を見ながら穏やかに過ごされた。",
      createdAt: date(14, 9),
      updatedAt: date(14, 9),
      approvedBy: "ito",
      status: "approved",
      history: [],
    },
    {
      id: "care-history-kobayashi-kentaro-3",
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-3",
      kind: "care",
      category: "Activity",
      content: "午後の体操に参加され、終了後に水分を150mL摂取された。",
      evidence: "体操に参加。終わったあと水を150mL飲まれた。",
      createdAt: date(3, 14),
      updatedAt: date(3, 14),
      approvedBy: "ito",
      status: "approved",
      history: [],
    },
    {
      id: "care-history-kobayashi-kentaro-0",
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-0",
      kind: "care",
      category: "Mood",
      content:
        "午前中、浅草の落語会の思い出を話され、笑顔が多く見られた。",
      evidence: "浅草で落語を見た話をされ、何度か笑顔が見られた。",
      createdAt: date(0, 10),
      updatedAt: date(0, 10),
      approvedBy: "ito",
      status: "approved",
      history: [],
    },
  ];
  state.information.push(...care);

  const profile: Omit<Information, "id" | "kind" | "status" | "history">[] = [
    {
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-14",
      category: "Former occupation",
      content: "浅草の和菓子店で長く働いていた。",
      evidence: "浅草の和菓子店で働いていた頃の話をされた。",
      createdAt: date(14, 9),
      updatedAt: date(14, 9),
      approvedBy: "ito",
    },
    {
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-14",
      category: "Interests",
      content: "落語と散歩が好き。",
      evidence: "落語を聞くのが好きで、天気の良い日は散歩を楽しみにされる。",
      createdAt: date(14, 9),
      updatedAt: date(14, 9),
      approvedBy: "ito",
    },
    {
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-3",
      category: "Family",
      content: "長男家族が月に一度面会に来る。",
      evidence: "長男と孫が来る日を楽しみにしていると話された。",
      createdAt: date(3, 14),
      updatedAt: date(3, 14),
      approvedBy: "ito",
    },
    {
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-0",
      category: "Care preferences",
      content: "急かされると不安になりやすく、予定を先に伝えると落ち着く。",
      evidence: "次の予定を先に伝えると安心される様子があった。",
      createdAt: date(0, 10),
      updatedAt: date(0, 10),
      approvedBy: "ito",
    },
    {
      residentId: kentaroId,
      recordingId: "history-kobayashi-kentaro-0",
      category: "Communication",
      content: "冗談を交えた会話を好み、昔の浅草の話題で表情が和らぐ。",
      evidence: "浅草の話や冗談に笑顔で応じられた。",
      createdAt: date(0, 10),
      updatedAt: date(0, 10),
      approvedBy: "ito",
    },
  ];
  state.information.push(
    ...profile.map((item, index) => ({
      ...item,
      id: `profile-kobayashi-kentaro-${index}`,
      kind: "profile" as const,
      status: "approved" as const,
      history: [],
    })),
  );

  for (const item of care)
    state.records.push({
      id: `record-${item.recordingId}`,
      residentId: kentaroId,
      recordingId: item.recordingId,
      content: item.content,
      createdAt: item.createdAt,
      approvedBy: item.approvedBy,
    });

  const graph = buildMemoryGraph(state.information);
  state.memoryNodes = graph.memoryNodes;
  state.memoryEpisodes = graph.memoryEpisodes;
  state.memoryEdges = graph.memoryEdges;
  return state;
}
