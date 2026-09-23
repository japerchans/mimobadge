"use client";
import type { Information, Resident, WorkspaceResponse } from "@/types";
import { ChevronRight, MessageCircle, Send, Smile } from "lucide-react";
import Link from "next/link";
import { KokologMark } from "./kokolog-mark";
import { useEffect, useRef, useState } from "react";
import { ja } from "@/lib/ja";
import { moodTimeline } from "@/domain/mood";
import { CareRecordView } from "./care-record-view";
import { FamilyReports } from "./facility-views";
import { DailyReview } from "./daily-review";
import { groupDailyCareRecords } from "./daily-care-records";
import { Action, Avatar, Empty, formatDate, Status, time } from "./shared";
export function ResidentWorkspace({
  resident: r,
  data,
  inspect,
  action,
  activeTab,
  reviewDate,
}: {
  resident: Resident;
  data: WorkspaceResponse;
  inspect: (item: Information) => void;
  action: Action;
  activeTab: string;
  reviewDate?: string;
}) {
  const tab = ["chat", "review", "records", "profile", "family"].includes(
    activeTab,
  )
    ? activeTab
    : "chat";
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { question: string; answer: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [chatError, setChatError] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const messageEnd = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messages.length)
      messageEnd.current?.scrollIntoView({ block: "nearest" });
  }, [messages, busy, chatError]);
  const items = data.information.filter((i) => i.residentId === r.id);
  const profile = items.filter((i) => i.kind === "profile");
  const moodPoints = moodTimeline(data.information, r.id);
  const greeting = `${r.name}さんについて、知りたいことを聞いてください。確認済みの記録と記憶グラフをもとにお答えします。`;
  const ask = async (text: string) => {
    const next = text.trim();
    if (!next || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setChatError("");
    setPendingQuestion(next);
    setQuestion("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          residentId: r.id,
          question: next,
          history: messages.slice(-10),
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "回答を取得できませんでした。");
      setMessages((previous) => [
        ...previous,
        { question: next, answer: result.answer },
      ]);
      setPendingQuestion("");
    } catch (error) {
      if (!controller.signal.aborted)
        setChatError(
          error instanceof Error
            ? error.message
            : "接続を確認して再試行してください。",
        );
    } finally {
      requestRef.current = null;
      setBusy(false);
    }
  };
  const pending = data.recordings.filter(
    (x) => x.residentId === r.id && x.status === "review",
  );
  const records = groupDailyCareRecords(data.records)
    .filter((record) => record.residentId === r.id)
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
          ...(pending.length ? [["review", "1日分の確認"]] : []),
          ["chat", "この方について"],
          ["records", "介護記録"],
          ["profile", "プロフィール"],
          ["family", "家族レポート"],
        ].map(([value, label]) => (
          <Link
            role="tab"
            aria-selected={tab === value}
            className={tab === value ? "active" : ""}
            key={value}
            href={
              value === "chat"
                ? `/residents/${r.id}`
                : value === "review"
                  ? `/residents/${r.id}/review/${reviewDate || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })}`
                  : `/residents/${r.id}/${value}`
            }
          >
            {label}
          </Link>
        ))}
      </div>
      <div
        className={`resident-thread-layout${tab === "chat" ? " chat-layout" : ""}`}
      >
        <section className="conversation-feed">
          {tab === "review" && reviewDate ? (
            <DailyReview
              resident={r}
              reportDate={reviewDate}
              data={data}
              action={action}
            />
          ) : tab === "chat" ? (
            <section className="ai-memory-chat" aria-label="この方について">
              <div
                className="chat-messages"
                role="log"
                aria-label="こころんAIとの会話"
                aria-live="polite"
              >
                <div className="ai-message">
                  <span className="ai-avatar">
                    <KokologMark />
                  </span>
                  <div>
                    <strong>こころんAI</strong>
                    <p>{greeting}</p>
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
                        <KokologMark />
                      </span>
                      <div>
                        <strong>こころんAI</strong>
                        <p>{message.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingQuestion && (
                  <div className="chat-turn">
                    <div className="user-message">
                      <strong>あなた</strong>
                      <p>{pendingQuestion}</p>
                    </div>
                    <div className="ai-message">
                      <span className="ai-avatar">
                        <KokologMark />
                      </span>
                      <div>
                        <strong>こころんAI</strong>
                        {busy ? (
                          <p role="status">記録を確認しています…</p>
                        ) : (
                          <>
                            <p role="alert">{chatError}</p>
                            <button
                              className="chat-retry"
                              onClick={() => ask(pendingQuestion)}
                            >
                              もう一度試す
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messageEnd} />
              </div>
              <div className="chat-composer">
                {messages.length === 0 && !pendingQuestion && (
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
                    maxLength={2000}
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="家族、好きなこと、今日の様子などを質問"
                    aria-label={`${r.name}さんについて質問`}
                  />
                  <button
                    type="submit"
                    aria-label="質問する"
                    disabled={busy || !question.trim()}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </section>
          ) : tab === "profile" ? (
            <>
              {moodPoints.length > 0 && (
                <section className="mood-timeline" aria-label="最近の様子">
                  <div className="row">
                    <Smile size={18} />
                    <h2>最近の様子</h2>
                  </div>
                  <p className="muted small">
                    会話で確認できた表情や気分の記録です。診断や推測ではありません。
                  </p>
                  <div>
                    {moodPoints.map((point, index) => (
                      <article key={`${point.source}-${point.date}-${index}`}>
                        <time>{formatDate(point.date)}</time>
                        <strong>{point.label}</strong>
                        <p>{point.content}</p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
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
          ) : tab === "family" ? (
            <FamilyReports
              data={data}
              action={action}
              residentId={r.id}
              embedded
            />
          ) : (
            records.map((day) => (
              <article className="panel resident-record" key={day.id}>
                <div className="panel-header">
                  <div>
                    <h2>{formatDate(day.createdAt)}</h2>
                    <span className="muted small">
                      {day.records.length}件の録音を反映 · 確認した職員：
                      {data.caregivers.find(
                        (caregiver) => caregiver.id === day.approvedBy,
                      )?.name || "職員"}
                    </span>
                  </div>
                  <Status value="approved" />
                </div>
                <div className="record-content">
                  <CareRecordView
                    record={day.structured}
                    empty={day.content}
                  />
                  {day.structured && (
                    <details className="record-summary">
                      <summary>経過要約</summary>
                      <p>{day.content}</p>
                    </details>
                  )}
                  <details className="source-recordings">
                    <summary>元の録音 {day.records.length}件</summary>
                    {day.records.map((record) => (
                      <Link
                        key={record.id}
                        href={`/processing/${record.recordingId}`}
                      >
                        {time(record.createdAt)}
                        <ChevronRight size={13} />
                      </Link>
                    ))}
                  </details>
                </div>
              </article>
            ))
          )}
          {tab === "records" && !records.length && (
            <Empty>確定した介護記録はまだありません。</Empty>
          )}
        </section>
      </div>
    </>
  );
}
