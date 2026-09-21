import type { Information } from "@/types";

export type MoodPoint = {
  date: string;
  label: string;
  content: string;
  source: string;
};

const moodPattern =
  /Mood|Emotion|気分|表情|笑顔|笑い|穏やか|楽し|嬉し|不安|寂し|悲し|怒り|落ち込|疲れ/i;

function labelFor(content: string) {
  if (/笑顔|笑い|笑った|楽し|嬉し/.test(content)) return "明るい様子";
  if (/穏やか|落ち着/.test(content)) return "穏やか";
  if (/不安|心配/.test(content)) return "不安な様子";
  if (/寂し|悲し|落ち込/.test(content)) return "沈んだ様子";
  if (/怒り|苛立|いら立/.test(content)) return "落ち着かない様子";
  if (/疲れ|眠そう/.test(content)) return "疲れた様子";
  return "様子の記録";
}

export function moodTimeline(
  information: Information[],
  residentId: string,
): MoodPoint[] {
  const points: MoodPoint[] = [];
  for (const item of information.filter(
    (candidate) =>
      candidate.residentId === residentId &&
      moodPattern.test(`${candidate.category} ${candidate.content}`),
  )) {
    for (const history of item.history)
      points.push({
        date: history.date,
        label: labelFor(history.content),
        content: history.content,
        source: history.source,
      });
    points.push({
      date: item.updatedAt,
      label: labelFor(item.content),
      content: item.content,
      source: item.recordingId,
    });
  }
  return points.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
}
