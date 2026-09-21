"use client";
import { ja } from "@/lib/ja";
import { generateDraft } from "@/domain/mnemonet";
import type { Proposal, Recording, WorkspaceResponse } from "@/types";
import {
  ArrowLeft,
  ArrowUpRight,
  AudioLines,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  HeartHandshake,
  Leaf,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Action,
  duration,
  Empty,
  formatDate,
  Modal,
  PageHeading,
  Status,
  time,
} from "./shared";
export const stages = [
  "録音を準備",
  "話者を区別",
  "文字起こし",
  "情報を整理",
  "下書きを作成",
];
export function RecordingWorkspace({
  recording: r,
  data,
  action,
}: {
  recording: Recording;
  data: WorkspaceResponse;
  action: Action;
}) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [association, setAssociation] = useState(r.residentId || "");
  const [proposals, setProposals] = useState<Proposal[]>(r.proposals);
  const [draft, setDraft] = useState(r.draft);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const resident = data.residents.find((p) => p.id === r.residentId);
  useEffect(() => {
    setProposals(r.proposals);
    setDraft(r.draft);
  }, [r.revision, r.proposals, r.draft]);
  const process = async () => {
    setRunning(true);
    setError("");
    try {
      for (let stage = r.stage; stage < 5; stage++)
        await action({ type: "process", id: r.id });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };
  const save = async (approve: boolean) => {
    setSaving(true);
    setError("");
    try {
      await action(
        {
          type: "review",
          id: r.id,
          revision: r.revision,
          proposals: proposals.map(({ id, content, status }) => ({
            id,
            content,
            status,
          })),
          draft,
          approve,
        },
        approve
          ? "記録を確定し、入居者の情報に反映しました。"
          : "下書きを保存しました",
      );
      setConfirm(false);
    } catch (e) {
      setError((e as Error).message);
      setConfirm(false);
    } finally {
      setSaving(false);
    }
  };
  const updateProposal = (id: string, patch: Partial<Proposal>) => {
    const next = proposals.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setProposals(next);
    if (draft === generateDraft(proposals)) setDraft(generateDraft(next));
  };
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        確認待ちに戻る
      </Link>
      <PageHeading
        title={
          resident ? `${resident.name} · 会話の記録` : "会話した入居者を選択"
        }
        description={`${formatDate(r.createdAt)} ${time(r.createdAt)}${r.duration ? ` · ${duration(r.duration)}` : ""} · ${r.source === "sd-card" ? r.sourceName || "SDカード音声" : "デモ録音"} · ${data.caregivers.find((c) => c.id === r.caregiverId)?.name}`}
      >
        <Status value={r.status} />
      </PageHeading>
      {error && (
        <div className="error-banner" role="alert">
          {ja(error)}
        </div>
      )}
      {r.status === "completed" ? (
        <>
          <div className="success-panel">
            <span className="success-icon">
              <CheckCheck size={26} />
            </span>
            <div>
              <h2>記録を確定しました</h2>
              <p>
                介護記録、メモリーブレイン、家族レポートの下書きに反映しました。会話の全文は削除しました。
              </p>
            </div>
            {resident && (
              <div className="row success-links">
                <Link className="button" href="/family">
                  家族レポート
                </Link>
                <Link
                  className="button primary"
                  href={`/residents/${resident.id}`}
                >
                  メモリーブレインを開く
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            )}
          </div>
          <section className="panel">
            <div className="panel-header">
              <h2>確定した介護記録</h2>
              <Status value="approved" />
            </div>
            <div className="final-record" lang="ja">
              {data.records.find((record) => record.recordingId === r.id)
                ?.content || "この録音から保存された介護記録はありません。"}
            </div>
          </section>
          <section className="panel approved-items">
            <div className="panel-header">
              <h2>反映した情報</h2>
            </div>
            {data.information
              .filter((i) => i.recordingId === r.id)
              .map((i) => (
                <div key={i.id}>
                  <span className="eyebrow">
                    {i.kind === "care" ? "今日の介護記録" : "プロフィール"} ·{" "}
                    {ja(i.category)}
                  </span>
                  <p lang="ja">{i.content}</p>
                </div>
              ))}
          </section>
        </>
      ) : (
        <>
          <section className="association panel">
            <div>
              <span className="eyebrow">会話した入居者</span>
              <h3>{resident?.name || "入居者を選択"}</h3>
              <p className="muted small">
                {r.residentMatch === "automatic"
                  ? "録音冒頭の名乗りから自動判定しました。確定前に入居者を確認してください。"
                  : "入居者を確認してください。話者の区別は本人確認ではありません。"}
              </p>
            </div>
            <div className="row">
              <select
                aria-label="会話した入居者を選択"
                value={association}
                disabled={running || saving}
                onChange={(e) => setAssociation(e.target.value)}
              >
                <option value="">入居者を選択</option>
                {data.residents.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.room}
                  </option>
                ))}
              </select>
              {association !== r.residentId && association && (
                <button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setError("");
                    try {
                      await action(
                        {
                          type: "associate",
                          id: r.id,
                          residentId: association,
                        },
                        "入居者を設定しました",
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  この入居者に設定
                </button>
              )}
            </div>
          </section>
          <div className="pipeline">
            {stages.map((stage, i) => (
              <div
                key={stage}
                className={
                  r.stage > i
                    ? "done"
                    : r.stage === i && running
                      ? "current"
                      : ""
                }
              >
                <span>{r.stage > i ? <Check size={14} /> : i + 1}</span>
                {stage}
              </div>
            ))}
          </div>
          {r.status !== "review" ? (
            <section className="panel processing-start">
              <AudioLines size={38} />
              <h2>
                {running
                  ? stages[Math.min(r.stage, 4)] + "…"
                  : r.stage > 0
                    ? "中断した処理を再開できます"
                    : "録音が届いています"}
              </h2>
              <p>
                会話から必要な情報を整理して、介護記録の下書きを作成します。
              </p>
              <button
                className="primary"
                disabled={running || saving || !r.residentId}
                onClick={process}
              >
                {running ? (
                  <RefreshCw className="spin" size={17} />
                ) : (
                  <AudioLines size={17} />
                )}
                {running
                  ? "整理しています…"
                  : r.stage > 0
                    ? "処理を再開"
                    : "下書きを作成"}
              </button>
              <small>
                {r.source === "sd-card"
                  ? "アップロードした音声を文字起こしします。"
                  : "デモ用の会話を使います。実際の音声解析は行いません。"}
              </small>
            </section>
          ) : (
            <>
              <div className="review-layout">
                <section className="panel transcript-panel">
                  <div className="panel-header">
                    <h2>元の会話</h2>
                    <span className="demo-chip">
                      {r.source === "sd-card" ? "SDカード" : "デモ"}
                    </span>
                  </div>
                  <div className="audio-summary">
                    <AudioLines size={24} />
                    <div>
                      <strong>録音の内容</strong>
                      <small>
                        {r.duration ? `${duration(r.duration)} · ` : ""}
                        {r.source === "sd-card"
                          ? `${r.sourceName || "音声ファイル"} · 文字起こし済み`
                          : "デモ録音"}
                      </small>
                    </div>
                  </div>
                  <div className="transcript">
                    {r.transcript.length ? (
                      r.transcript.map((segment, index) => (
                        <article
                          className={`transcript-segment ${segment.speaker}`}
                          key={index}
                        >
                          <div>
                            <strong>
                              {segment.speaker === "caregiver"
                                ? data.caregivers.find(
                                    (c) => c.id === r.caregiverId,
                                  )?.name
                                : resident?.name}
                            </strong>
                            <span>
                              {Math.floor(segment.start / 60)
                                .toString()
                                .padStart(2, "0")}
                              :
                              {(segment.start % 60).toString().padStart(2, "0")}
                            </span>
                          </div>
                          <small>
                            {segment.speaker === "caregiver"
                              ? "介護職員"
                              : "入居者"}
                          </small>
                          <p lang="ja">{segment.text}</p>
                        </article>
                      ))
                    ) : (
                      <Empty>
                        会話全文の保存期間が終了しました。残っている出典を確認してから確定してください。
                      </Empty>
                    )}
                  </div>
                  <div className="panel-note">
                    <Clock3 size={16} />
                    <span>
                      会話全文は記録の確定後、または7日後に削除します。
                    </span>
                  </div>
                </section>
                <div className="extraction-column">
                  <section className="panel">
                    <div className="panel-header">
                      <h2>記録に残す内容</h2>
                      <span className="muted small">内容ごとに確認</span>
                    </div>
                    {(["care", "profile", "ignored"] as const).map((kind) => (
                      <div className={`proposal-group ${kind}`} key={kind}>
                        <div className="proposal-group-title">
                          <span>
                            {kind === "care" ? (
                              <HeartHandshake size={16} />
                            ) : kind === "profile" ? (
                              <Leaf size={16} />
                            ) : (
                              <X size={16} />
                            )}
                            {kind === "care"
                              ? "今日の介護記録"
                              : kind === "profile"
                                ? "プロフィール"
                                : "記録しない会話"}
                          </span>
                          <small>
                            {proposals.filter((p) => p.kind === kind).length} 件
                          </small>
                        </div>
                        {proposals
                          .filter((p) => p.kind === kind)
                          .map((p) => (
                            <div
                              className={`proposal ${p.status === "rejected" ? "excluded" : ""}`}
                              key={p.id}
                            >
                              <div className="row spread">
                                <strong>{ja(p.category)}</strong>
                                {kind !== "ignored" && (
                                  <button
                                    className="small-button"
                                    onClick={() =>
                                      updateProposal(p.id, {
                                        status:
                                          p.status === "rejected"
                                            ? "pending"
                                            : "rejected",
                                      })
                                    }
                                  >
                                    {p.status === "rejected"
                                      ? "記録に戻す"
                                      : "記録から除外"}
                                  </button>
                                )}
                              </div>
                              {kind === "ignored" ? (
                                <p>{ja(p.content)}</p>
                              ) : (
                                <textarea
                                  aria-label={`${ja(p.category)} の候補`}
                                  value={ja(p.content)}
                                  disabled={p.status === "rejected" || saving}
                                  onChange={(e) =>
                                    updateProposal(p.id, {
                                      content: e.target.value,
                                      status: "edited",
                                    })
                                  }
                                  rows={2}
                                />
                              )}
                              <details>
                                <summary>根拠となる発言</summary>
                                <p lang="ja">
                                  {p.evidence ||
                                    "発言の保存期間が終了しました。"}
                                </p>
                              </details>
                              {p.status === "edited" && (
                                <span className="edited-label">
                                  編集した内容です。確定前に確認してください。
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    ))}
                  </section>
                  {r.context.length > 0 && (
                    <section className="context-callout">
                      <div className="row">
                        <Clock3 size={17} />
                        <h3>過去の記録から</h3>
                      </div>
                      {r.context.map((c) => (
                        <p key={c} lang="ja">
                          {ja(c)}
                        </p>
                      ))}
                      <small>
                        すでに確認された情報です。プロフィールを更新しても、以前の内容は履歴に残ります。
                      </small>
                    </section>
                  )}
                  <section className="panel draft-panel">
                    <div className="panel-header">
                      <h2>介護記録の下書き</h2>
                      <button
                        className="text-link"
                        onClick={() => setDraft(generateDraft(proposals))}
                      >
                        <RefreshCw size={14} />
                        選択内容から作り直す
                      </button>
                    </div>
                    <div className="draft-body">
                      <label className="sr-only" htmlFor="draft">
                        介護記録の下書き
                      </label>
                      <textarea
                        id="draft"
                        lang="ja"
                        rows={5}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={saving}
                      />
                      <p className="muted small">
                        残す内容と文章が一致しているか確認してください。
                      </p>
                    </div>
                  </section>
                </div>
              </div>
              <div className="review-actions">
                <div>
                  <span className="row">
                    <CircleHelp size={17} />
                    <strong>確認した内容だけを記録に残します。</strong>
                  </span>
                  <small>
                    {
                      proposals.filter(
                        (p) => p.kind !== "ignored" && p.status !== "rejected",
                      ).length
                    }{" "}
                    件の情報を反映します： {resident?.name}さん
                  </small>
                </div>
                <div className="row">
                  <button onClick={() => save(false)} disabled={saving}>
                    下書きを保存
                  </button>
                  <button
                    className="primary"
                    onClick={() => setConfirm(true)}
                    disabled={
                      saving ||
                      proposals.some(
                        (p) =>
                          p.kind !== "ignored" &&
                          p.status !== "rejected" &&
                          !p.content.trim(),
                      )
                    }
                  >
                    <Check size={17} />
                    確認して共有知識に反映
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {confirm && (
        <Modal
          title="この内容で記録を確定しますか？"
          close={() => !saving && setConfirm(false)}
        >
          <div className="dialog-body">
            <p>
              次の入居者の介護記録、メモリーブレイン、家族レポートの下書きに反映します：{" "}
              <strong>{resident?.name}</strong>さん
            </p>
            <div className="confirmation-record" lang="ja">
              {draft || "今日の介護記録は選択されていません。"}
            </div>
            <p className="muted small">
              除外した内容は保存しません。会話の全文は削除されます。家族への自動送信は行いません。
            </p>
          </div>
          <div className="dialog-actions">
            <button disabled={saving} onClick={() => setConfirm(false)}>
              確認に戻る
            </button>
            <button
              className="primary"
              disabled={saving}
              onClick={() => save(true)}
            >
              {saving ? "確定中…" : "確定して共有知識に反映"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
