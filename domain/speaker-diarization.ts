import type { Segment } from "@/types";

export type DiarizedSegment = {
  speaker: string;
  start: number;
  end: number;
  text: string;
};

export type SpeakerRole = Segment["speaker"];

export function parseDiarizedSegments(value: unknown): DiarizedSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 240)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const candidate = item as Record<string, unknown>;
      const text = String(candidate.text || "")
        .trim()
        .slice(0, 4000);
      const speaker = String(candidate.speaker || "")
        .trim()
        .slice(0, 80);
      const start = Number(candidate.start);
      const end = Number(candidate.end);
      if (!text || !speaker || !Number.isFinite(start) || !Number.isFinite(end))
        return null;
      return {
        speaker,
        start: Math.max(0, start),
        end: Math.max(Math.max(0, start), end),
        text,
      };
    })
    .filter((segment): segment is DiarizedSegment => Boolean(segment));
}

export function assignSpeakerRoles(
  diarized: DiarizedSegment[],
  residentName: string,
  supplied: Record<string, SpeakerRole> = {},
): Segment[] {
  const labels = [...new Set(diarized.map((segment) => segment.speaker))];
  const compactName = residentName.replace(/[\s　]/g, "");
  const surname = compactName.slice(0, 2);
  const introduction = diarized.find((segment) => {
    if (segment.start > 45) return false;
    const text = segment.text.replace(/[\s　]/g, "");
    return (
      text.includes(`${compactName}さんです`) ||
      text.includes(`${surname}さんです`) ||
      text.includes(`${compactName}様です`) ||
      text.includes(`${surname}様です`)
    );
  });
  const caregiverLabel = introduction?.speaker || labels[0];
  const residentLabel = labels.find((label) => label !== caregiverLabel);

  return diarized.map((segment) => ({
    speaker:
      supplied[segment.speaker] ||
      (segment.speaker === caregiverLabel
        ? "caregiver"
        : segment.speaker === residentLabel
          ? "resident"
          : "unknown"),
    start: segment.start,
    end: segment.end,
    text: segment.text,
  }));
}

export function plainTranscript(segments: DiarizedSegment[]) {
  return segments.map((segment) => segment.text).join("\n");
}

export function labeledTranscript(segments: DiarizedSegment[]) {
  return segments
    .map(
      (segment) =>
        `[話者 ${segment.speaker} ${formatTime(segment.start)}] ${segment.text}`,
    )
    .join("\n");
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)
    .toString()
    .padStart(2, "0")}:${(safe % 60).toString().padStart(2, "0")}`;
}
