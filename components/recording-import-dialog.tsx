"use client";

import { ja } from "@/lib/ja";
import type { Resident } from "@/types";
import {
  Check,
  FileAudio,
  FolderOpen,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { Modal } from "./shared";

type ImportItem = {
  key: string;
  file: File;
  residentId: string;
  status: "waiting" | "uploading" | "done" | "error";
  error?: string;
  recordingId?: string;
};

const acceptedExtensions = /\.(m4a|mp3|wav|webm|ogg|aac|flac|mp4)$/i;
const maxBytes = 24 * 1024 * 1024;

export function RecordingImportDialog({
  residents,
  close,
  refresh,
  openRecording,
}: {
  residents: Resident[];
  close: () => void;
  refresh: () => Promise<void>;
  openRecording: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming).slice(0, Math.max(0, 10 - items.length));
    if (!next.length) return;
    setNotice("");
    setItems((current) => [
      ...current,
      ...next.map((file) => {
        const validType =
          file.type.startsWith("audio/") || file.type === "video/mp4";
        const error =
          file.size > maxBytes
            ? "24MBを超えています"
            : !validType && !acceptedExtensions.test(file.name)
              ? "対応していない形式です"
              : undefined;
        return {
          key: crypto.randomUUID(),
          file,
          residentId: "",
          status: error ? ("error" as const) : ("waiting" as const),
          error,
        };
      }),
    ]);
  };

  const importOne = async (item: ImportItem) => {
    setItems((current) =>
      current.map((candidate) =>
        candidate.key === item.key
          ? { ...candidate, status: "uploading", error: undefined }
          : candidate,
      ),
    );
    try {
      const form = new FormData();
      form.set("residentId", item.residentId);
      form.set("file", item.file);
      const response = await fetch("/api/import-recording", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(ja(result.error));
      setItems((current) =>
        current.map((candidate) =>
          candidate.key === item.key
            ? { ...candidate, status: "done", recordingId: result.id }
            : candidate,
        ),
      );
      return true;
    } catch (error) {
      setItems((current) =>
        current.map((candidate) =>
          candidate.key === item.key
            ? {
                ...candidate,
                status: "error",
                error:
                  error instanceof Error
                    ? error.message
                    : "取り込めませんでした",
              }
            : candidate,
        ),
      );
      return false;
    }
  };

  const startImport = async () => {
    const targets = items.filter(
      (item) => item.residentId && item.status !== "done" && !item.error,
    );
    if (!targets.length) return;
    setBusy(true);
    setNotice("");
    let completed = 0;
    for (const item of targets) if (await importOne(item)) completed++;
    await refresh();
    setBusy(false);
    setNotice(
      completed === targets.length
        ? `${completed}件を確認待ちに追加しました。`
        : `${completed}件を追加しました。失敗したファイルは再試行できます。`,
    );
  };

  const ready = items.some(
    (item) => item.residentId && item.status !== "done" && !item.error,
  );
  const needsResident = items.some(
    (item) => item.status !== "done" && !item.error && !item.residentId,
  );

  return (
    <Modal title="録音ファイルを取り込む" close={() => !busy && close()}>
      <div className="dialog-body import-dialog-body">
        <p>
          SDカードをパソコンで開き、録音ファイルをここへドラッグしてください。複数の録音をまとめて選べます。
        </p>
        <button
          type="button"
          className={`audio-dropzone${dragging ? " dragging" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node))
              setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          disabled={busy || items.length >= 10}
        >
          <Upload size={28} />
          <strong>ここに録音ファイルをドロップ</strong>
          <span>またはクリックしてファイルを選ぶ</span>
          <small>M4A・MP3・WAVなど／1件24MBまで／最大10件</small>
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          multiple
          accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm,.ogg,.aac,.flac"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        {items.length > 0 && (
          <div className="import-queue" aria-label="取り込む録音">
            {items.map((item) => (
              <div className={`import-file ${item.status}`} key={item.key}>
                <FileAudio size={20} />
                <div className="import-file-main">
                  <strong title={item.file.name}>{item.file.name}</strong>
                  <small>
                    {(item.file.size / 1024 / 1024).toFixed(1)}MB
                    {item.status === "uploading" && " · 文字起こしと整理中…"}
                    {item.status === "done" && " · 確認待ちに追加済み"}
                    {item.error && ` · ${item.error}`}
                  </small>
                </div>
                {item.status === "done" ? (
                  <button
                    type="button"
                    className="small-button import-open"
                    onClick={() => openRecording(item.recordingId!)}
                  >
                    <Check size={14} />
                    確認する
                  </button>
                ) : (
                  <>
                    <select
                      aria-label={`${item.file.name}の入居者`}
                      value={item.residentId}
                      disabled={
                        busy || Boolean(item.error && item.file.size > maxBytes)
                      }
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((candidate) =>
                            candidate.key === item.key
                              ? {
                                  ...candidate,
                                  residentId: event.target.value,
                                  status:
                                    candidate.status === "error" &&
                                    !candidate.error
                                      ? "waiting"
                                      : candidate.status,
                                }
                              : candidate,
                          ),
                        )
                      }
                    >
                      <option value="">入居者を選択</option>
                      {residents.map((resident) => (
                        <option key={resident.id} value={resident.id}>
                          {resident.name} · {resident.room}号室
                        </option>
                      ))}
                    </select>
                    {item.status === "error" &&
                      !item.error?.includes("24MB") && (
                        <button
                          type="button"
                          className="icon-button"
                          aria-label={`${item.file.name}を再試行`}
                          onClick={() =>
                            setItems((current) =>
                              current.map((candidate) =>
                                candidate.key === item.key
                                  ? {
                                      ...candidate,
                                      status: "waiting",
                                      error: undefined,
                                    }
                                  : candidate,
                              ),
                            )
                          }
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`${item.file.name}を削除`}
                      disabled={busy}
                      onClick={() =>
                        setItems((current) =>
                          current.filter(
                            (candidate) => candidate.key !== item.key,
                          ),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="muted small">
          会話全文は記録確定後、または7日後に削除します。メモリーブレインへ反映する前に、必ず職員が内容を確認します。
        </p>
        {needsResident && (
          <p className="error" role="status">
            取り込む録音ごとに、会話した入居者を選択してください。
          </p>
        )}
        {notice && (
          <p className="import-notice" role="status">
            {notice}
          </p>
        )}
      </div>
      <div className="dialog-actions">
        <button type="button" onClick={close} disabled={busy}>
          閉じる
        </button>
        <button
          type="button"
          className="primary"
          disabled={busy || !ready || needsResident}
          onClick={startImport}
        >
          <FolderOpen size={16} />
          {busy ? "文字起こし中…" : "取り込んで文字起こし"}
        </button>
      </div>
    </Modal>
  );
}
