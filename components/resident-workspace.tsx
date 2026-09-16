"use client";
import type { Information, Resident, WorkspaceResponse } from "@/types";
import {
  Brain,
  ChevronRight,
  FileText,
  MessageCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ja } from "@/lib/ja";
import {
  Avatar,
  CaregiverAvatar,
  Empty,
  formatDate,
  isToday,
  Status,
  time,
} from "./shared";
export function ResidentWorkspace({
  resident: r,
  data,
  inspect,
}: {
  resident: Resident;
  data: WorkspaceResponse;
  inspect: (item: Information) => void;
}) {
  const [tab, setTab] = useState("chat");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: string }[]
  >([]);
  const messageEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length)
      messageEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages]);
  const items = data.information.filter((i) => i.residentId === r.id);
  const profile = items.filter((i) => i.kind === "profile");
  const careItems = items.filter((i) => i.kind === "care");
  const graphNodes = data.memoryNodes.filter(
    (node) => node.residentId === r.id,
  );
  const answerQuestion = (askedQuestion: string) => {
    const lower = askedQuestion.toLocaleLowerCase("ja");
    const byCategory = (category: string) =>
      profile
        .filter((item) => item.category === category)
        .map((item) => item.content);
    if (!askedQuestion)
      return [
        `${r.name}さんについて、確認済みの記録と記憶グラフから大事な情報だけをまとめます。`,
        profile
          .slice(0, 3)
          .map((item) => `${ja(item.category)}：${item.content}`)
          .join("\n"),
      ]
        .filter(Boolean)
        .join("\n\n");
    if (lower.includes("家族") || lower.includes("family"))
      return (
        byCategory("Family").join("\n") ||
        "家族に関する確認済み情報はまだ少ないです。"
      );
    if (
      lower.includes("好き") ||
      lower.includes("趣味") ||
      lower.includes("interest")
    )
      return (
        byCategory("Interests").join("\n") ||
        "好きなことはまだ確認済み情報にありません。"
      );
    if (
      lower.includes("今日") ||
      lower.includes("状態") ||
      lower.includes("様子")
    )
      return careItems
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 3)
        .map((item) => `${formatDate(item.updatedAt)}：${item.content}`)
        .join("\n");
    if (
      lower.includes("記憶") ||
      lower.includes("memory") ||
      lower.includes("関係")
    )
      return graphNodes.length
        ? graphNodes
            .slice(0, 6)
            .map(
              (node) =>
                `${node.label}（${ja(node.type)}・${node.mentionCount}回）`,
            )
            .join("\n")
        : "記憶グラフに表示できるノードはまだありません。";
    return (
      [...profile, ...careItems]
        .filter((item) => item.content.includes(askedQuestion.slice(0, 4)))
        .slice(0, 4)
        .map((item) => `${ja(item.category)}：${item.content}`)
        .join("\n") ||
      "近い情報は見つかりませんでした。プロフィールか記録を開いて確認してください。"
    );
  };
  const ask = (text: string) => {
    const next = text.trim();
    if (!next) return;
    setMessages((previous) => [
      ...previous,
      {
        question: next,
        answer:
          answerQuestion(next) || "該当する確認済みの記録はまだありません。",
      },
    ]);
    setQuestion("");
  };
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
          ["chat", "AIメモ"],
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
      <div
        className={`resident-thread-layout${tab === "chat" ? " chat-layout" : ""}`}
      >
        <section className="conversation-feed">
          {tab !== "chat" &&
            pending.map((recording) => (
              <Link
                className="pending-bubble"
                href={`/processing/${recording.id}`}
                key={recording.id}
              >
                <FileText size={20} />
                <div>
                  <strong>
                    {formatDate(recording.createdAt)}{" "}
                    {time(recording.createdAt)} の会話
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
          {tab === "chat" ? (
            <section className="ai-memory-chat" aria-label="AIメモ">
              <div
                className="chat-messages"
                role="log"
                aria-label="ここログAIとの会話"
                aria-live="polite"
              >
                <div className="ai-message">
                  <span className="ai-avatar">
                    <Brain size={18} />
                  </span>
                  <div>
                    <strong>ここログAI</strong>
                    <p>{answerQuestion("")}</p>
                  </div>
                </div>
                {messages.map((message, index) => (
                  <div className="chat-turn" key={index}>
                    <div className="user-message">
                      <strong>あなた</strong>
                      <p>{message.question}</p>
                    </div>
                    <div className="ai-message">
                      <span className="ai-avatar">
                        <Brain size={18} />
                      </span>
                      <div>
                        <strong>ここログAI</strong>
                        <p>{message.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messageEnd} />
              </div>
              <div className="chat-composer">
                {messages.length === 0 && (
                  <div className="quick-questions" aria-label="よく使う質問">
                    {[
                      "家族に伝えること",
                      "好きなこと",
                      "今日の様子",
                      "記憶グラフ",
                    ].map((sample) => (
                      <button key={sample} onClick={() => ask(sample)}>
                        {sample}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="ai-question-box"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const next = question.trim();
                    if (!next) return;
                    ask(next);
                  }}
                >
                  <MessageCircle size={18} />
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="家族、好きなこと、今日の様子などを質問"
                    aria-label={`${r.name}さんについて質問`}
                  />
                  <button
                    type="submit"
                    aria-label="質問する"
                    disabled={!question.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </section>
          ) : tab === "profile" ? (
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
                    {data.caregivers.find(
                      (c) => c.id === event.caregiverId,
                    ) && (
                      <CaregiverAvatar
                        caregiver={data.caregivers.find(
                          (c) => c.id === event.caregiverId,
                        )!}
                      />
                    )}
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
          {tab !== "chat" && tab !== "profile" && !events.length && (
            <Empty>この期間の確定した記録はありません。</Empty>
          )}
        </section>
        {tab !== "chat" && tab !== "profile" && (
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
