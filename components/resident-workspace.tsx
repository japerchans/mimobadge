"use client";
import type { Information, Resident, WorkspaceResponse } from "@/types";
import { ChevronRight, FileText, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ja } from "@/lib/ja";
import { Avatar, Empty, formatDate, isToday, Status, time } from "./shared";
export function ResidentWorkspace({
  resident: r,
  data,
  inspect,
}: {
  resident: Resident;
  data: WorkspaceResponse;
  inspect: (item: Information) => void;
}) {
  const [tab, setTab] = useState("history");
  const items = data.information.filter((i) => i.residentId === r.id);
  const profile = items.filter((i) => i.kind === "profile");
  const pending = data.recordings.filter(
    (x) => x.residentId === r.id && x.status !== "completed",
  );
  const events = data.recordings
    .filter(
      (x) =>
        x.residentId === r.id &&
        x.status === "completed" &&
        (tab === "history" || isToday(x.createdAt)),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <div className="resident-heading">
        <Avatar resident={r} large />
        <div>
          <h1>{r.name}</h1>
          <p>
            {r.room}号室 · {r.age}歳 · 担当{" "}
            {data.caregivers.find((c) => c.id === r.caregiverId)?.name}
          </p>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="表示する情報">
        {[
          ["today", "今日の記録"],
          ["history", "これまでの記録"],
          ["profile", "プロフィール"],
        ].map(([value, label]) => (
          <button
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            key={value}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="resident-thread-layout">
        <section className="conversation-feed">
          {pending.map((recording) => (
            <Link
              className="pending-bubble"
              href={`/processing/${recording.id}`}
              key={recording.id}
            >
              <FileText size={20} />
              <div>
                <strong>
                  {formatDate(recording.createdAt)} {time(recording.createdAt)}{" "}
                  の会話
                </strong>
                <p>
                  {recording.status === "review"
                    ? "内容を確認して記録を確定してください。"
                    : "録音の内容を整理して、記録の下書きを作成します。"}
                </p>
              </div>
              <span>
                確認する
                <ChevronRight size={16} />
              </span>
            </Link>
          ))}
          {tab === "profile" ? (
            <>
              <p className="muted">
                項目を選ぶと、出典の確認・編集・削除ができます。
              </p>
              {profile.map((i) => (
                <button
                  className="memory-bubble"
                  key={i.id}
                  onClick={() => inspect(i)}
                >
                  <span>{ja(i.category)}</span>
                  <p>{i.content}</p>
                  <small>
                    {formatDate(i.updatedAt)} 更新 · 出典と編集
                    <ChevronRight size={13} />
                  </small>
                </button>
              ))}
            </>
          ) : (
            events.map((event) => {
              const record = data.records.find(
                (x) => x.recordingId === event.id,
              );
              const notes = items.filter((i) => i.recordingId === event.id);
              return (
                <article className="conversation-entry" key={event.id}>
                  <div className="conversation-date">
                    {formatDate(event.createdAt)} · {time(event.createdAt)}
                  </div>
                  <div className="entry-author">
                    <span className="staff-avatar">
                      {
                        data.caregivers.find((c) => c.id === event.caregiverId)
                          ?.name[0]
                      }
                    </span>
                    <span>
                      {
                        data.caregivers.find((c) => c.id === event.caregiverId)
                          ?.name
                      }
                    </span>
                    <Status value="approved" />
                  </div>
                  <div className="record-bubble">
                    <p>
                      {record?.content || "プロフィールの情報を確認しました。"}
                    </p>
                    <Link
                      href={`/processing/${event.id}`}
                      className="text-link"
                    >
                      元の記録を開く
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                  {notes
                    .filter((i) => i.kind === "profile")
                    .map((i) => (
                      <button
                        className="memory-bubble compact"
                        key={i.id}
                        onClick={() => inspect(i)}
                      >
                        <span>
                          {i.kind === "profile"
                            ? "プロフィールに反映"
                            : "介護記録"}{" "}
                          · {ja(i.category)}
                        </span>
                        <p>{i.content}</p>
                        <small>
                          出典を確認・編集
                          <ChevronRight size={13} />
                        </small>
                      </button>
                    ))}
                  {notes.some((i) => i.kind === "care") && (
                    <details className="care-breakdown">
                      <summary>項目別に確認・編集</summary>
                      {notes
                        .filter((i) => i.kind === "care")
                        .map((i) => (
                          <button
                            className="memory-bubble compact"
                            key={i.id}
                            onClick={() => inspect(i)}
                          >
                            <span>{ja(i.category)}</span>
                            <p>{i.content}</p>
                            <small>
                              出典を確認・編集
                              <ChevronRight size={13} />
                            </small>
                          </button>
                        ))}
                    </details>
                  )}
                </article>
              );
            })
          )}
          {tab !== "profile" && !events.length && (
            <Empty>この期間の確定した記録はありません。</Empty>
          )}
        </section>
        {tab !== "profile" && (
          <aside className="person-context">
            <h2>この方について</h2>
            {profile.slice(0, 4).map((i) => (
              <button key={i.id} onClick={() => inspect(i)}>
                <span>{ja(i.category)}</span>
                <p>{i.content}</p>
              </button>
            ))}
            <button className="text-link" onClick={() => setTab("profile")}>
              プロフィールを開く
              <ChevronRight size={14} />
            </button>
          </aside>
        )}
      </div>
    </>
  );
}
