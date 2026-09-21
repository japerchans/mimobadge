import type {
  CareMeasurement,
  CareRecordField,
  Information,
  Proposal,
  StructuredCareRecord,
  Workspace,
} from "@/types";

export const careRecordFieldLabels: Record<CareRecordField, string> = {
  focus: "F｜着眼点",
  subjective: "S｜本人・家族の言葉",
  objective: "O｜観察・数値",
  assessment: "A｜職員の判断",
  intervention: "I｜行ったケア",
  plan: "P｜次の対応",
};

const accepted = (proposal: Proposal) =>
  proposal.kind === "care" && proposal.status !== "rejected";

function inferField(proposal: Proposal): CareRecordField {
  const value = `${proposal.category} ${proposal.content}`;
  if (/予定|継続|経過観察|次回|申し送|plan/i.test(value)) return "plan";
  if (/介助|声かけ|対応|実施|連絡|促し|交換|塗布|intervention/i.test(value))
    return "intervention";
  if (/見られ|過ごされ|摂取|参加|会話された|確認|測定|objective/i.test(value))
    return "objective";
  if (/訴え|話され|とのこと|希望|拒否|subjective/i.test(value))
    return "subjective";
  if (/判断|考えられ|可能性|assessment/i.test(value)) return "assessment";
  return "objective";
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function extractCareMeasurements(text: string): CareMeasurement[] {
  const measurements: CareMeasurement[] = [];
  const add = (kind: CareMeasurement["kind"], label: string, value: string) =>
    measurements.push({ kind, label, value });
  const bloodPressure = text.match(
    /血圧[^\d]{0,12}(\d{2,3})\s*[／/]\s*(\d{2,3})/i,
  );
  if (bloodPressure)
    add(
      "blood-pressure",
      "血圧",
      `${bloodPressure[1]}/${bloodPressure[2]} mmHg`,
    );
  const temperature = text.match(
    /(?:体温|検温)[^\d]{0,12}(\d{2}(?:\.\d)?)\s*(?:℃|度)?/i,
  );
  if (temperature) add("temperature", "体温", `${temperature[1]} ℃`);
  const pulse = text.match(/(?:脈拍|脈)[^\d]{0,12}(\d{2,3})\s*(?:回\/分|回)?/i);
  if (pulse) add("pulse", "脈拍", `${pulse[1]} 回/分`);
  const spo2 = text.match(/(?:SpO2|酸素飽和度)[^\d]{0,12}(\d{2,3})\s*%?/i);
  if (spo2) add("spo2", "SpO₂", `${spo2[1]} %`);
  const fluid = text.match(
    /(?:水分|飲水)[^\d]{0,12}(\d{2,4})\s*(?:ml|mL|ミリ)/i,
  );
  if (fluid) add("fluid", "水分", `${fluid[1]} mL`);
  const percent = text.match(
    /(?:食事|朝食|昼食|夕食)[^。\n]{0,30}?(\d{1,3})\s*%/,
  );
  const ratio = text.match(
    /(?:食事|朝食|昼食|夕食)[^。\n]{0,30}?([0-9０-９])\s*割/,
  );
  if (percent) add("meal", "食事", `${percent[1]} %`);
  else if (ratio)
    add("meal", "食事", `${Number(ratio[1].normalize("NFKC")) * 10} %`);
  else if (/(?:食事|朝食|昼食|夕食)[^。\n]{0,30}?(?:全量|完食)/.test(text))
    add("meal", "食事", "100 %");
  const elimination = text.match(
    /((?:排尿|排便|尿|便)[^。\n]{0,35}(?:あり|なし|確認|介助|普通|軟便|硬便))/,
  );
  if (elimination) add("elimination", "排泄", elimination[1]);
  return measurements.filter(
    (item, index, all) =>
      all.findIndex(
        (candidate) =>
          candidate.kind === item.kind && candidate.value === item.value,
      ) === index,
  );
}

export function buildStructuredCareRecord(
  proposals: Proposal[],
): StructuredCareRecord {
  const care = proposals.filter(accepted);
  const record: StructuredCareRecord = {
    format: "F-SOAIP",
    focus: unique(care.map((proposal) => proposal.category)),
    subjective: [],
    objective: [],
    assessment: [],
    intervention: [],
    plan: [],
    measurements: extractCareMeasurements(
      care.map((proposal) => proposal.content).join("\n"),
    ),
  };
  for (const proposal of care) {
    const field = proposal.recordField || inferField(proposal);
    if (field === "focus") continue;
    record[field].push(proposal.content);
  }
  for (const field of [
    "subjective",
    "objective",
    "assessment",
    "intervention",
    "plan",
  ] as const)
    record[field] = unique(record[field]);
  return record;
}

function informationAsProposal(item: Information): Proposal {
  return {
    id: item.id,
    kind: "care",
    category: item.category,
    content: item.content,
    evidence: item.evidence,
    status: "approved",
  };
}

/** Adds the structured view to records created before F-SOAIP support. */
export function ensureStructuredCareRecords(state: Workspace): Workspace {
  for (const record of state.records) {
    if (record.structured) continue;
    const recording = state.recordings.find(
      (candidate) => candidate.id === record.recordingId,
    );
    const recordingCare = (recording?.proposals || []).filter(
      (proposal) => proposal.kind === "care" && proposal.status !== "rejected",
    );
    const proposals = recordingCare.length
      ? recordingCare
      : state.information
          .filter(
            (item) =>
              item.recordingId === record.recordingId && item.kind === "care",
          )
          .map(informationAsProposal);
    if (proposals.length)
      record.structured = buildStructuredCareRecord(proposals);
  }
  return state;
}
