import type { Workspace, Information, Recording } from "@/types";
import { buildMemoryGraph } from "@/domain/memory-graph";
const date = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
};
export function seedWorkspace(): Workspace {
  const residents = [
    {
      id: "tanaka",
      name: "田中 花子",
      kana: "Hanako Tanaka",
      age: 84,
      room: "201",
      caregiverId: "aoki",
      since: "2023-04-12",
      initials: "田",
    },
    {
      id: "suzuki",
      name: "鈴木 一郎",
      kana: "Ichiro Suzuki",
      age: 81,
      room: "202",
      caregiverId: "aoki",
      since: "2024-02-03",
      initials: "鈴",
    },
    {
      id: "sato",
      name: "佐藤 京子",
      kana: "Kyoko Sato",
      age: 88,
      room: "203",
      caregiverId: "ito",
      since: "2022-11-18",
      initials: "佐",
    },
    {
      id: "yamamoto",
      name: "山本 正雄",
      kana: "Masao Yamamoto",
      age: 79,
      room: "205",
      caregiverId: "ito",
      since: "2024-06-09",
      initials: "山",
    },
    {
      id: "kobayashi",
      name: "小林 幸子",
      kana: "Sachiko Kobayashi",
      age: 86,
      room: "206",
      caregiverId: "nakamura",
      since: "2023-08-22",
      initials: "小",
    },
  ];
  const profiles = [
    [
      ["Former occupation", "小学校の教員をしていた。"],
      ["Interests", "園芸が好き。"],
      ["Family", "娘が週末に訪問する。"],
      ["Communication", "学校や昔の生徒の話を楽しむ。"],
    ],
    [
      ["Former occupation", "鉄道会社で勤務していた。"],
      ["Interests", "将棋と相撲観戦が好き。"],
      ["Routine", "朝食後に新聞を読む。"],
    ],
    [
      ["Former occupation", "和裁の仕事をしていた。"],
      ["Interests", "編み物と手芸が好き。"],
      ["Communication", "ゆっくり、正面から話しかけることを好む。"],
    ],
    [
      ["Former occupation", "写真館を営んでいた。"],
      ["Interests", "家族の写真を見ることを楽しむ。"],
      ["Family", "息子が写真のアルバムを持参する。"],
    ],
    [
      ["Former occupation", "喫茶店を営んでいた。"],
      ["Interests", "昭和の歌を歌うことが好き。"],
      ["Routine", "午後にお茶を飲むことを楽しみにしている。"],
    ],
  ];
  const information: Information[] = [];
  const recordings: Recording[] = [];
  const records: Workspace["records"] = [];
  residents.forEach((resident, index) => {
    for (const days of [14, 3, 0]) {
      const id = `history-${resident.id}-${days}`;
      const care =
        days === 0
          ? [
              "朝食は全量摂取。",
              "朝食後、新聞を読んで過ごされた。",
              "午前中は手芸活動に参加された。",
              "家族の写真を見ながら会話された。",
              "午後のお茶を楽しみにされていた。",
            ][index]
          : "食事後、職員と穏やかに会話された。";
      recordings.push({
        id,
        residentId: resident.id,
        caregiverId: resident.caregiverId,
        createdAt: date(days, 8),
        duration: 150 + index * 20,
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
      information.push({
        id: `care-${id}`,
        residentId: resident.id,
        recordingId: id,
        kind: "care",
        category:
          days === 0
            ? ["Meals", "Routine", "Activity", "Engagement", "Observation"][
                index
              ]
            : "Observation",
        content: care,
        evidence: care,
        createdAt: date(days, 8),
        updatedAt: date(days, 8),
        approvedBy: resident.caregiverId,
        status: "approved",
        history: [],
      });
      records.push({
        id: `record-${id}`,
        residentId: resident.id,
        recordingId: id,
        content: care,
        createdAt: date(days, 8),
        approvedBy: resident.caregiverId,
      });
    }
    profiles[index].forEach(([category, content], pi) =>
      information.push({
        id: `profile-${resident.id}-${pi}`,
        residentId: resident.id,
        recordingId: `history-${resident.id}-${pi % 2 === 0 ? 14 : 3}`,
        kind: "profile",
        category,
        content,
        evidence: content,
        createdAt: date(pi % 2 === 0 ? 14 : 3),
        updatedAt: date(pi % 2 === 0 ? 14 : 3),
        approvedBy: resident.caregiverId,
        status: "approved",
        history: [],
      }),
    );
  });
  for (const [i, id] of ["tanaka", "sato", "suzuki"].entries())
    recordings.unshift({
      id: `MB-${1024 - i}`,
      residentId: id,
      caregiverId: residents.find((r) => r.id === id)!.caregiverId,
      createdAt: date(0, 10 - i),
      duration: 152 + i * 61,
      status: "received",
      stage: 0,
      transcript: [],
      proposals: [],
      draft: "",
      context: [],
      source: "demo",
      retentionUntil: date(-7),
      revision: 0,
    });
  const graph = buildMemoryGraph(information);
  return {
    facility: { id: "sakura", name: "Sakura Care Home" },
    residents,
    caregivers: [
      {
        id: "aoki",
        name: "青木 美咲",
        role: "Caregiver",
        badge: "MB-01",
        shift: "07:00 – 16:00",
      },
      {
        id: "ito",
        name: "伊藤 健太",
        role: "Caregiver",
        badge: "MB-02",
        shift: "08:00 – 17:00",
      },
      {
        id: "nakamura",
        name: "中村 陽子",
        role: "Shift lead",
        badge: "MB-03",
        shift: "12:00 – 21:00",
      },
    ],
    recordings,
    information,
    records,
    audit: [],
    handoffs: [],
    ...graph,
  };
}
