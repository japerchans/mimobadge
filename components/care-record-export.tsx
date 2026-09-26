"use client";
import { Download } from "lucide-react";
import type { Caregiver, Resident } from "@/types";
import type { DailyCareRecord } from "./daily-care-records";
import { formatDate, time } from "./shared";

type CareRecordExportProps = {
  day: DailyCareRecord;
  resident: Resident;
  caregiver?: Caregiver;
};

type ExportFormat = "wiseman" | "csv" | "text";

const formatLabels: Record<ExportFormat, string> = {
  wiseman: "ワイズマン用CSV",
  csv: "汎用CSV",
  text: "帳票テキスト",
};

const safeFilePart = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\s]+/g, "-")
    .replace(/^-+|-+$/g, "") || "care-record";

const csvCell = (value: unknown) => {
  const text = String(value ?? "").replace(/\r?\n/g, "\n");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csv = (rows: unknown[][]) =>
  rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";

const joinLines = (values?: string[]) => (values || []).filter(Boolean).join("\n");

const measurementsByLabel = (day: DailyCareRecord, pattern: RegExp) =>
  (day.structured?.measurements || [])
    .filter((item) => pattern.test(`${item.kind} ${item.label}`))
    .map((item) => `${item.label} ${item.value}`)
    .join("\n");

const timeRange = (day: DailyCareRecord) => {
  const sorted = [...day.records].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  return {
    start: sorted[0] ? time(sorted[0].createdAt) : "",
    end: sorted.at(-1) ? time(sorted.at(-1)!.createdAt) : "",
  };
};

export function careRecordExportText({
  day,
  resident,
  caregiver,
}: CareRecordExportProps) {
  const structured = day.structured;
  const lines = [
    "介護記録",
    `記録日：${formatDate(day.createdAt)}`,
    `利用者：${resident.name}（${resident.room}号室）`,
    `確認者：${caregiver?.name || "職員"}`,
    `元録音：${day.records.length}件`,
    "",
    "バイタル・観察値",
    ...(structured?.measurements.length
      ? structured.measurements.map((item) => `・${item.label} ${item.value}`)
      : ["・記録なし"]),
    "",
    "F｜着眼点",
    joinLines(structured?.focus) || "記録なし",
    "",
    "S｜本人・家族の言葉",
    joinLines(structured?.subjective) || "記録なし",
    "",
    "O｜観察・数値",
    joinLines(structured?.objective) || "記録なし",
    "",
    "A｜職員の判断",
    joinLines(structured?.assessment) || "記録なし",
    "",
    "I｜行ったケア",
    joinLines(structured?.intervention) || "記録なし",
    "",
    "P｜次の対応",
    joinLines(structured?.plan) || "記録なし",
    "",
    "経過要約",
    day.content || "記録なし",
  ];
  return lines.join("\n") + "\n";
}

export function careRecordExportCsv({
  day,
  resident,
  caregiver,
}: CareRecordExportProps) {
  return csv([
    [
      "記録日",
      "利用者ID",
      "利用者名",
      "居室",
      "確認者",
      "元録音数",
      "バイタル・観察値",
      "F_着眼点",
      "S_本人家族の言葉",
      "O_観察数値",
      "A_職員判断",
      "I_行ったケア",
      "P_次の対応",
      "経過要約",
      "元録音ID",
    ],
    [
      day.date,
      resident.id,
      resident.name,
      resident.room,
      caregiver?.name || "職員",
      day.records.length,
      joinLines(
        day.structured?.measurements.map(
          (item) => `${item.label} ${item.value}`,
        ),
      ),
      joinLines(day.structured?.focus),
      joinLines(day.structured?.subjective),
      joinLines(day.structured?.objective),
      joinLines(day.structured?.assessment),
      joinLines(day.structured?.intervention),
      joinLines(day.structured?.plan),
      day.content,
      day.records.map((record) => record.recordingId).join(" "),
    ],
  ]);
}

export function careRecordExportWisemanCsv({
  day,
  resident,
  caregiver,
}: CareRecordExportProps) {
  const range = timeRange(day);
  const structured = day.structured;
  return csv([
    [
      "利用者コード",
      "利用者氏名",
      "居室",
      "記録日",
      "開始時刻",
      "終了時刻",
      "記録種別",
      "血圧",
      "体温",
      "脈拍",
      "SpO2",
      "食事",
      "水分",
      "排泄",
      "F_着眼点",
      "S_本人家族の言葉",
      "O_観察数値",
      "A_職員判断",
      "I_実施ケア",
      "P_次回対応",
      "記録本文",
      "記録者",
      "取込元",
      "元録音ID",
    ],
    [
      resident.id,
      resident.name,
      resident.room,
      day.date,
      range.start,
      range.end,
      "日常介護記録",
      measurementsByLabel(day, /blood-pressure|血圧/),
      measurementsByLabel(day, /temperature|体温/),
      measurementsByLabel(day, /pulse|脈拍/),
      measurementsByLabel(day, /spo2|SpO₂|SpO2/),
      measurementsByLabel(day, /meal|食事/),
      measurementsByLabel(day, /fluid|水分/),
      measurementsByLabel(day, /elimination|排泄/),
      joinLines(structured?.focus),
      joinLines(structured?.subjective),
      joinLines(structured?.objective),
      joinLines(structured?.assessment),
      joinLines(structured?.intervention),
      joinLines(structured?.plan),
      day.content,
      caregiver?.name || "職員",
      "こころん",
      day.records.map((record) => record.recordingId).join(" "),
    ],
  ]);
}

function downloadFile(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob(["\ufeff", text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CareRecordExport({ day, resident, caregiver }: CareRecordExportProps) {
  const download = (format: ExportFormat) => {
    const base = `${day.date}-${safeFilePart(resident.name)}-介護記録`;
    if (format === "text")
      return downloadFile(
        `${base}.txt`,
        careRecordExportText({ day, resident, caregiver }),
        "text/plain;charset=utf-8",
      );
    if (format === "wiseman")
      return downloadFile(
        `${base}-wiseman.csv`,
        careRecordExportWisemanCsv({ day, resident, caregiver }),
        "text/csv;charset=utf-8",
      );
    return downloadFile(
      `${base}.csv`,
      careRecordExportCsv({ day, resident, caregiver }),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <details className="export-menu">
      <summary>
        <Download size={14} />
        出力
      </summary>
      <div>
        {(["wiseman", "csv", "text"] as const).map((format) => (
          <button key={format} type="button" onClick={() => download(format)}>
            {formatLabels[format]}
          </button>
        ))}
      </div>
    </details>
  );
}
