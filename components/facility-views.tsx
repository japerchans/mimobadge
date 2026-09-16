"use client";
import { ja, jaHandoff } from "@/lib/ja";
import type { WorkspaceResponse } from "@/types";
import {
  ArrowUpRight,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  LogOut,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Action,
  Avatar,
  Empty,
  formatDate,
  isToday,
  PageHeading,
  RecordingRow,
  time,
} from "./shared";
export function Recordings({
  data,
  onTransfer,
}: {
  data: WorkspaceResponse;
  onTransfer: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const rows = data.recordings
    .filter(
      (r) =>
        filter === "all" ||
        (filter === "pending"
          ? r.status !== "completed"
          : r.status === "completed"),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeading
        title="録音一覧"
        description="録音を選んで内容を確認し、介護記録を確定します。"
      >
        <button className="primary" onClick={onTransfer}>
          <Plus size={16} />
          デモ録音を追加
        </button>
      </PageHeading>
      <div className="tabs">
        {[
          ["all", "すべての録音"],
          ["pending", "未確認"],
          ["completed", "確定済み"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label}
            <span>
              {
                data.recordings.filter(
                  (r) =>
                    key === "all" ||
                    (key === "pending"
                      ? r.status !== "completed"
                      : r.status === "completed"),
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2>{filter === "pending" ? "確認待ちの録音" : "録音履歴"}</h2>
          <span className="muted small">デモ用の録音データ</span>
        </div>
        {rows.map((r) => (
          <div key={r.id}>
            <div className="record-date">{formatDate(r.createdAt)}</div>
            <RecordingRow recording={r} data={data} />
          </div>
        ))}
        {!rows.length && <Empty>該当する録音はありません。</Empty>}
      </section>
    </>
  );
}
export function Residents({ data }: { data: WorkspaceResponse }) {
  const [query, setQuery] = useState("");
  return (
    <>
      <PageHeading
        title="入居者"
        description="名前を選ぶと、その方の記録とプロフィールを開けます。"
      />
      <label className="search page-search">
        <Search size={17} />
        <input
          placeholder="名前・部屋番号で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <section className="panel">
        {data.residents
          .filter((r) =>
            `${r.name} ${ja(r.kana)} ${r.room}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((r) => (
            <Link
              className="directory-row"
              key={r.id}
              href={`/residents/${r.id}`}
            >
              <Avatar resident={r} />
              <div>
                <h3>{r.name}</h3>
                <small>{ja(r.kana)}</small>
              </div>
              <span>居室{r.room}</span>
              <span className="muted">
                {data.caregivers.find((c) => c.id === r.caregiverId)?.name}
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
      </section>
    </>
  );
}
export function Records({ data }: { data: WorkspaceResponse }) {
  const [residentId, setResidentId] = useState("");
  return (
    <>
      <PageHeading
        title="介護記録"
        description="職員が内容を確認し、確定した記録です。"
      />
      <div className="filter-bar">
        <select
          aria-label="入居者で絞り込む"
          value={residentId}
          onChange={(e) => setResidentId(e.target.value)}
        >
          <option value="">すべての入居者</option>
          {data.residents.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <span className="muted small">確定時点の内容を保存しています。</span>
      </div>
      <div className="records-list">
        {data.records
          .filter((r) => !residentId || r.residentId === residentId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((record) => {
            const r = data.residents.find((r) => r.id === record.residentId)!;
            return (
              <section className="panel" key={record.id}>
                <div className="panel-header">
                  <Link className="row" href={`/residents/${r.id}`}>
                    <Avatar resident={r} />
                    <h3>{r.name}</h3>
                  </Link>
                  <span className="muted small">
                    {formatDate(record.createdAt)} · {time(record.createdAt)}
                  </span>
                </div>
                <div className="record-content">
                  <p lang="ja">{record.content}</p>
                  <div className="row spread">
                    <span className="muted small">
                      確認した職員：{" "}
                      {
                        data.caregivers.find((c) => c.id === record.approvedBy)
                          ?.name
                      }
                    </span>
                    <Link
                      className="text-link"
                      href={`/processing/${record.recordingId}`}
                    >
                      元の記録を見る
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
      </div>
    </>
  );
}
export function Handoffs({
  data,
  action,
}: {
  data: WorkspaceResponse;
  action: Action;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("current");
  const download = (text: string) => {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "mimobadge-handoff.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <PageHeading
        title="申し送り"
        description="確定した記録とプロフィールを次の担当者へ共有します。"
      >
        <button
          className="primary"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await action({ type: "handoff" }, "申し送りを保存しました");
              setView("saved");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <FileText size={16} />
          {busy ? "作成中…" : "申し送りを作成・保存"}
        </button>
      </PageHeading>
      {error && (
        <p role="alert" className="error">
          {ja(error)}
        </p>
      )}
      <div className="tabs">
        <button
          className={view === "current" ? "active" : ""}
          onClick={() => setView("current")}
        >
          今日の内容
        </button>
        <button
          className={view === "saved" ? "active" : ""}
          onClick={() => setView("saved")}
        >
          保存済み<span>{data.handoffs.length}</span>
        </button>
      </div>
      {view === "current" ? (
        <div className="handoff-grid">
          {data.residents.map((r) => (
            <section className="panel" key={r.id}>
              <div className="panel-header">
                <Link className="row" href={`/residents/${r.id}`}>
                  <Avatar resident={r} />
                  <h3>{r.name}</h3>
                </Link>
                <span className="muted small">居室{r.room}</span>
              </div>
              <div className="handoff-content">
                <h3>今日の記録</h3>
                {data.information
                  .filter(
                    (i) =>
                      i.residentId === r.id &&
                      i.kind === "care" &&
                      isToday(i.createdAt),
                  )
                  .map((i) => (
                    <p key={i.id} lang="ja">
                      {i.content}
                    </p>
                  ))}
                <h3>対応の参考</h3>
                {data.information
                  .filter((i) => i.residentId === r.id && i.kind === "profile")
                  .slice(0, 3)
                  .map((i) => (
                    <p className="muted" key={i.id} lang="ja">
                      {i.content}
                    </p>
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : data.handoffs.length ? (
        <div className="records-list">
          {data.handoffs.map((h) => (
            <section className="panel" key={h.id}>
              <div className="panel-header">
                <h2>
                  {formatDate(h.createdAt)} · {time(h.createdAt)}
                </h2>
                <button onClick={() => download(jaHandoff(h.content))}>
                  <Download size={15} />
                  テキストを保存
                </button>
              </div>
              <pre className="handoff-text" lang="ja">
                {jaHandoff(h.content)}
              </pre>
            </section>
          ))}
        </div>
      ) : (
        <Empty>
          保存済みの申し送りはありません。「申し送りを作成・保存」から作成できます。
        </Empty>
      )}
    </>
  );
}
export function Staff({ data }: { data: WorkspaceResponse }) {
  return (
    <>
      <PageHeading
        title="担当職員"
        description="担当する入居者と勤務時間を確認できます。"
      />
      <div className="staff-grid">
        {data.caregivers.map((c) => (
          <section className="panel staff-card" id={c.id} key={c.id}>
            <span className="staff-avatar large">{c.name[0]}</span>
            <h2>{c.name}</h2>
            <p>{ja(c.role)}</p>
            <dl className="about-list">
              <dt>勤務時間</dt>
              <dd>{c.shift}</dd>
              <dt>入居者</dt>
              <dd>
                {data.residents
                  .filter((r) => r.caregiverId === c.id)
                  .map((r) => (
                    <Link href={`/residents/${r.id}`} key={r.id}>
                      {r.name}
                      <ChevronRight size={13} />
                    </Link>
                  ))}
              </dd>
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
export function SettingsPage({ data }: { data: WorkspaceResponse }) {
  return (
    <>
      <PageHeading
        title="設定・利用情報"
        description="データの保存方法と操作履歴を確認できます。"
      />
      <div className="settings-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>介護記録</h2>
          </div>
          <dl className="settings-list">
            <dt>施設</dt>
            <dd>{ja(data.facility.name)}</dd>
            <dt>権限</dt>
            <dd>介護職員（確認・確定が可能）</dd>
            <dt>データの保存先</dt>
            <dd>
              {data.storage === "postgresql"
                ? "PostgreSQL"
                : "この端末のデモファイル"}
            </dd>
            <dt>音声の処理</dt>
            <dd>デモ処理（実際の音声解析は未接続）</dd>
            <dt>会話全文の保存期間</dt>
            <dd>記録確定後、または7日後に削除</dd>
            <dt>入居者情報の保存</dt>
            <dd>確認済みの内容と出典の抜粋のみ</dd>
          </dl>
          <div className="panel-note">
            <CircleHelp size={16} />
            <span>
              すべて架空のデータです。実運用には個人別ログイン、定期削除、音声解析サービスの接続が必要です。
            </span>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>操作履歴</h2>
            <span className="muted small">操作記録</span>
          </div>
          {data.audit.length ? (
            <div className="audit-list">
              {data.audit
                .slice()
                .sort((a, b) => b.at.localeCompare(a.at))
                .slice(0, 20)
                .map((log) => (
                  <div key={log.id}>
                    <strong>{ja(log.action)}</strong>
                    <small>
                      {data.caregivers.find((c) => c.id === log.actor)?.name} ·{" "}
                      {formatDate(log.at)} {time(log.at)}
                    </small>
                  </div>
                ))}
            </div>
          ) : (
            <Empty>確認・編集の操作を行うと、履歴が表示されます。</Empty>
          )}
        </section>
      </div>
      {data.storage === "postgresql" && (
        <button
          onClick={async () => {
            await fetch("/api/session", { method: "DELETE" });
            window.location.assign("/login");
          }}
        >
          <LogOut size={16} />
          ログアウト
        </button>
      )}
    </>
  );
}
