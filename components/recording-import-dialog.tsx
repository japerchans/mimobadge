"use client";

import { ja } from "@/lib/ja";
import type { DiarizedSegment } from "@/domain/speaker-diarization";
import {
  directRecordingLimit,
  largeWavLimit,
  splitWavFile,
} from "@/lib/wav-chunks";
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
  invalid?: boolean;
  residentName?: string;
  detectedAutomatically?: boolean;
  progress?: string;
};

const acceptedExtensions = /\.(m4a|mp3|wav|webm|ogg|aac|flac|mp4)$/i;

export function RecordingImportDialog({
  residents,
  close,
  refresh,
}: {
  residents: Resident[];
  close: () => void;
  refresh: () => Promise<void>;
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
        const isWav = /\.wav$/i.test(file.name);
        const error =
          file.size > largeWavLimit
            ? "200MBを超えています"
            : file.size > directRecordingLimit && !isWav
              ? "4MBを超える場合はWAVを選択してください"
              : !validType && !acceptedExtensions.test(file.name)
                ? "対応していない形式です"
                : undefined;
        return {
          key: crypto.randomUUID(),
          file,
          residentId: "auto",
          status: error ? ("error" as const) : ("waiting" as const),
          error,
          invalid: Boolean(error),
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
      let form = new FormData();
      form.set("residentId", item.residentId);
      if (item.file.size > directRecordingLimit) {
        const chunks = await splitWavFile(item.file);
        const transcripts: string[] = [];
        const diarizedSegments: DiarizedSegment[] = [];
        let timeOffset = 0;
        for (let index = 0; index < chunks.length; index++) {
          setItems((current) =>
            current.map((candidate) =>
              candidate.key === item.key
                ? {
                    ...candidate,
                    progress: `話者を区別しながら文字起こし中 ${index + 1}/${chunks.length}`,
                  }
                : candidate,
            ),
          );
          const chunkForm = new FormData();
          chunkForm.set("mode", "transcribe-chunk");
          chunkForm.set("file", chunks[index]);
          const chunkResponse = await fetch("/api/import-recording", {
            method: "POST",
            body: chunkForm,
          });
          const chunkResult = await chunkResponse.json();
          if (!chunkResponse.ok) throw new Error(ja(chunkResult.error));
          if (chunkResult.transcript?.trim())
            transcripts.push(chunkResult.transcript.trim());
          const chunkSegments = Array.isArray(chunkResult.segments)
            ? (chunkResult.segments as DiarizedSegment[])
            : [];
          for (const segment of chunkSegments) {
            diarizedSegments.push({
              speaker: `chunk-${index}-${segment.speaker}`,
              start: timeOffset + Number(segment.start || 0),
              end: timeOffset + Number(segment.end || 0),
              text: String(segment.text || ""),
            });
          }
          timeOffset += Math.max(
            0,
            ...chunkSegments.map((segment) => Number(segment.end || 0)),
          );
        }
        if (!transcripts.length)
          throw new Error("文字起こしできる会話が見つかりませんでした。");
        form = new FormData();
        form.set("mode", "assemble-chunks");
        form.set("residentId", item.residentId);
        form.set("transcript", transcripts.join("\n"));
        form.set("segments", JSON.stringify(diarizedSegments));
        form.set("sourceName", item.file.name);
      } else {
        form.set("file", item.file);
      }
      const response = await fetch("/api/import-recording", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(ja(result.error));
      setItems((current) =>
        current.map((candidate) =>
          candidate.key === item.key
            ? {
                ...candidate,
                status: "done",
                residentName: result.residentName,
                detectedAutomatically: result.detectedAutomatically,
                progress: undefined,
              }
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
                progress: undefined,
              }
            : candidate,
        ),
      );
      return false;
    }
  };

  const startImport = async () => {
    const targets = items.filter(
      (item) => item.status !== "done" && !item.error,
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
        ? `${completed}件を入居者ごとの1日分に追加しました。`
        : `${completed}件を追加しました。失敗したファイルは再試行できます。`,
    );
  };

  const ready = items.some((item) => item.status !== "done" && !item.error);

  return (
    <Modal title="録音ファイルを取り込む" close={() => !busy && close()}>
      <div className="dialog-body import-dialog-body">
        <p>
          録音ファイルをここへドラッグしてください。複数の録音をまとめて選べます。
        </p>
        <div className="auto-match-note">
          <Check size={17} />
          <span>
            録音の最初に「田中さんです」のように名前を話すと、こころんが入居者を自動で判定します。
          </span>
        </div>
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
          <small>M4A・MP3などは4MBまで／WAVは200MBまで／最大10件</small>
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
                    {item.status === "uploading" &&
                      ` · ${item.progress || "話者を区別しながら文字起こし中…"}`}
                    {item.status === "done" &&
                      ` · ${item.residentName}さん${item.detectedAutomatically ? "を自動判定" : "を選択"} · 1日分に追加済み`}
                    {item.error && ` · ${item.error}`}
                  </small>
                </div>
                {item.status === "done" ? (
                  <span className="small-button import-open">
                    <Check size={14} />
                    追加済み
                  </span>
                ) : (
                  <>
                    <select
                      aria-label={`${item.file.name}の入居者`}
                      value={item.residentId}
                      disabled={busy || item.invalid}
                      onChange={(event) =>
                        setItems((current) =>
                          current.map((candidate) =>
                            candidate.key === item.key
                              ? {
                                  ...candidate,
                                  residentId: event.target.value,
                                  status: candidate.error
                                    ? "waiting"
                                    : candidate.status,
                                  error: candidate.invalid
                                    ? candidate.error
                                    : undefined,
                                }
                              : candidate,
                          ),
                        )
                      }
                    >
                      <option value="auto">
                        自動判定（冒頭の「〇〇さんです」）
                      </option>
                      {residents.map((resident) => (
                        <option key={resident.id} value={resident.id}>
                          {resident.name} · {resident.room}号室
                        </option>
                      ))}
                    </select>
                    {item.status === "error" && !item.invalid && (
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
          会話全文は1日分の記録確定後、または7日後に削除します。職員は入居者ごとにまとめて内容を確認します。
        </p>
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
          disabled={busy || !ready}
          onClick={startImport}
        >
          <FolderOpen size={16} />
          {busy ? "文字起こし中…" : "取り込んで文字起こし"}
        </button>
      </div>
    </Modal>
  );
}
