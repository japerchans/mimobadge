"use client";
import { ja } from "@/lib/ja";
import type { Information, WorkspaceResponse } from "@/types";
import { ArrowUpRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Action, formatDate, Modal, Status, time } from "./shared";
export function InformationDetail({
  item,
  data,
  close,
  action,
}: {
  item: Information;
  data: WorkspaceResponse;
  close: () => void;
  action: Action;
}) {
  const [content, setContent] = useState(item.content);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await action(
        deleting
          ? {
              type: "delete-information",
              id: item.id,
              updatedAt: item.updatedAt,
            }
          : {
              type: "edit-information",
              id: item.id,
              content,
              updatedAt: item.updatedAt,
            },
        deleting ? "入居者の情報を削除しました" : "入居者の情報を更新しました",
      );
      close();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={deleting ? "この情報を削除しますか？" : ja(item.category)}
      close={() => !busy && close()}
    >
      <div className="dialog-body">
        <div className="row spread">
          <span className="eyebrow">
            {item.kind === "profile" ? "プロフィール" : "今日の介護記録"}
          </span>
          <Status value={item.status} />
        </div>
        {deleting ? (
          <p>
            現在のプロフィールと今後の申し送りから削除します。過去に確定した記録・保存済みの申し送りは変更されません。
          </p>
        ) : (
          <>
            <label>
              現在の内容
              <textarea
                autoFocus
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                lang="ja"
              />
            </label>
            <div className="source-box">
              <strong>情報の出典</strong>
              <p lang="ja">“{item.evidence}”</p>
              <Link href={`/processing/${item.recordingId}`} onClick={close}>
                介護中の会話 ·
                {formatDate(
                  data.recordings.find((r) => r.id === item.recordingId)
                    ?.createdAt || item.createdAt,
                )}{" "}
                <ArrowUpRight size={13} />
              </Link>
            </div>
            <dl className="metadata">
              <dt>最終確認</dt>
              <dd>
                {formatDate(item.updatedAt)} {time(item.updatedAt)}
              </dd>
              <dt>確認した職員</dt>
              <dd>
                {data.caregivers.find((c) => c.id === item.approvedBy)?.name}
              </dd>
            </dl>
            {item.history.length > 0 && (
              <div className="version-history">
                <h3>変更履歴</h3>
                {item.history.map((entry, index) => (
                  <div key={index}>
                    <small>{formatDate(entry.date)}</small>
                    <p lang="ja">{entry.content}</p>
                    <Link href={`/processing/${entry.source}`} onClick={close}>
                      元の会話を開く
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {ja(error)}
          </p>
        )}
      </div>
      <div className="dialog-actions">
        {deleting ? (
          <button onClick={() => setDeleting(false)} disabled={busy}>
            キャンセル
          </button>
        ) : (
          <button
            className="danger-text"
            disabled={busy}
            onClick={() => setDeleting(true)}
          >
            <Trash2 size={15} />
            削除
          </button>
        )}
        <button
          className={deleting ? "danger" : "primary"}
          disabled={busy || !content.trim()}
          onClick={save}
        >
          {busy ? "保存中…" : deleting ? "情報を削除" : "変更を保存"}
        </button>
      </div>
    </Modal>
  );
}
