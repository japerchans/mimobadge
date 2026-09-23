import type { CareRecord, StructuredCareRecord } from "@/types";

const japanDate = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date(iso))
    .filter((part) => ["year", "month", "day"].includes(part.type))
    .map((part) => part.value)
    .join("-");

const unique = (items: string[]) => [
  ...new Set(items.map((item) => item.trim()).filter(Boolean)),
];

const mergeStructured = (
  records: CareRecord[],
): StructuredCareRecord | undefined => {
  const structured = records
    .map((record) => record.structured)
    .filter((record): record is StructuredCareRecord => Boolean(record));
  if (!structured.length) return undefined;
  const measurements = structured.flatMap((record) => record.measurements);
  return {
    format: "F-SOAIP",
    focus: unique(structured.flatMap((record) => record.focus)),
    subjective: unique(structured.flatMap((record) => record.subjective)),
    objective: unique(structured.flatMap((record) => record.objective)),
    assessment: unique(structured.flatMap((record) => record.assessment)),
    intervention: unique(structured.flatMap((record) => record.intervention)),
    plan: unique(structured.flatMap((record) => record.plan)),
    measurements: measurements.filter(
      (item, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.kind === item.kind &&
            candidate.label === item.label &&
            candidate.value === item.value,
        ) === index,
    ),
  };
};

export type DailyCareRecord = {
  id: string;
  residentId: string;
  date: string;
  createdAt: string;
  approvedBy: string;
  records: CareRecord[];
  content: string;
  structured?: StructuredCareRecord;
};

export function groupDailyCareRecords(records: CareRecord[]): DailyCareRecord[] {
  const groups = records.reduce((map, record) => {
    const date = japanDate(record.createdAt);
    const key = `${record.residentId}:${date}`;
    const current = map.get(key) || [];
    current.push(record);
    map.set(key, current);
    return map;
  }, new Map<string, CareRecord[]>());
  return [...groups.entries()]
    .map(([id, group]) => {
      const sorted = [...group].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      );
      const latest = sorted.at(-1)!;
      return {
        id,
        residentId: latest.residentId,
        date: id.split(":").at(-1)!,
        createdAt: latest.createdAt,
        approvedBy: latest.approvedBy,
        records: sorted,
        content: unique(sorted.map((record) => record.content)).join("\n"),
        structured: mergeStructured(sorted),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
