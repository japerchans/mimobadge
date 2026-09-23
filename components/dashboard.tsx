"use client";
import type { WorkspaceResponse } from "@/types";
import { CalendarDays, ChevronRight, Upload } from "lucide-react";
import Link from "next/link";
import {
  Avatar,
  Empty,
  formatDate,
  PageHeading,
  RecordingRow,
  time,
} from "./shared";

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

export function Dashboard({
  data,
  onImport,
}: {
  data: WorkspaceResponse;
  onImport: () => void;
}) {
  const pending = data.recordings.filter((r) => r.status !== "completed");
  const dailyGroups = Array.from(
    pending
      .filter(
        (recording) => recording.status === "review" && recording.residentId,
      )
      .reduce((groups, recording) => {
        const date = japanDate(recording.createdAt);
        const key = `${recording.residentId}:${date}`;
        const current = groups.get(key) || {
          residentId: recording.residentId!,
          date,
          recordings: [],
        };
        current.recordings.push(recording);
        groups.set(key, current);
        return groups;
      }, new Map<string, { residentId: string; date: string; recordings: typeof pending }>()),
  )
    .map(([, group]) => group)
    .sort((a, b) => b.date.localeCompare(a.date));
  const groupsByDate = dailyGroups.reduce(
    (dates, group) => {
      const current = dates.get(group.date) || [];
      current.push(group);
      dates.set(group.date, current);
      return dates;
    },
    new Map<string, typeof dailyGroups>(),
  );
  const exceptions = pending.filter(
    (recording) => recording.status !== "review" || !recording.residentId,
  );

  return (
    <div className="inbox-workspace">
      <PageHeading
        title="1日分をまとめて確認"
        description="入居者ごとに、その日の会話から介護記録・プロフィール・家族レポートをまとめます。"
      >
        <button className="primary" onClick={onImport}>
          <Upload size={17} />
          録音ファイルを取り込む
        </button>
      </PageHeading>
      <section className="panel daily-inbox">
        <div className="panel-header">
          <div>
            <h2>日にちごとの録音</h2>
            <p className="muted small">
              同じ日の会話をまとめて、1つの記録にします。
            </p>
          </div>
        </div>
        <div className="daily-inbox-list">
          {[...groupsByDate.entries()].map(([date, groups]) => (
            <section className="daily-date-group" key={date}>
              <h3>
                <CalendarDays size={16} />
                {formatDate(groups[0].recordings[0].createdAt, {
                  weekday: "short",
                })}
              </h3>
              <div className="daily-date-recordings">
                {groups.map((group) => {
                  const resident = data.residents.find(
                    (candidate) => candidate.id === group.residentId,
                  );
                  if (!resident) return null;
                  const sorted = [...group.recordings].sort((a, b) =>
                    a.createdAt.localeCompare(b.createdAt),
                  );
                  return (
                    <Link
                      className="daily-inbox-row"
                      href={`/residents/${resident.id}/review/${group.date}`}
                      key={`${resident.id}-${group.date}`}
                    >
                      <Avatar resident={resident} />
                      <div>
                        <strong>{resident.name}さん</strong>
                        <span>{sorted.length}件の録音</span>
                        <div className="recording-time-chips">
                          {sorted.slice(0, 4).map((recording) => (
                            <small key={recording.id}>
                              {time(recording.createdAt)}
                            </small>
                          ))}
                          {sorted.length > 4 && (
                            <small>+{sorted.length - 4}件</small>
                          )}
                        </div>
                      </div>
                      <b>その日の記録を作る</b>
                      <ChevronRight size={18} />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        {!dailyGroups.length && (
          <Empty>今日まとめて確認する記録はありません。</Empty>
        )}
      </section>
      {exceptions.length > 0 && (
        <section className="panel daily-exceptions">
          <div className="panel-header">
            <div>
              <h2>対応が必要な録音</h2>
              <p className="muted small">
                入居者の選択や処理が終わると、上の1日分へまとまります。
              </p>
            </div>
          </div>
          {exceptions.map((recording) => (
            <RecordingRow
              key={recording.id}
              recording={recording}
              data={data}
            />
          ))}
        </section>
      )}
      <Link className="text-link" href="/processing">
        録音履歴を見る
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
