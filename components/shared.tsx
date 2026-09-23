"use client";
import { ja } from "@/lib/ja";
import type {
  Caregiver,
  Recording,
  Resident,
  WorkspaceResponse,
} from "@/types";
import { ChevronRight, Inbox, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
export const formatDate = (value: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(value).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Tokyo",
    ...opts,
  });
export const time = (value: string) =>
  new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
export const isToday = (value: string) =>
  formatDate(value, { year: "numeric" }) ===
  formatDate(new Date().toISOString(), { year: "numeric" });
export const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = {
    received: "未処理",
    processing: "整理中",
    review: "要確認",
    completed: "確定済み",
    approved: "確定済み",
    pending: "確認待ち",
    edited: "編集済み",
    rejected: "除外",
    failed: "処理失敗",
  };
  return (
    <span className={`status ${value}`}>
      <span />
      {labels[value] || value}
    </span>
  );
}
export function Avatar({
  resident,
  large = false,
}: {
  resident: Resident;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className={`avatar ${large ? "large" : ""}`}>
      {resident.initials || resident.name.slice(0, 1)}
    </span>
  ) : (
    <img
      className={`avatar portrait ${large ? "large" : ""}`}
      src={`/avatars/${resident.id}.png`}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
export function CaregiverAvatar({
  caregiver,
  large = false,
}: {
  caregiver: Caregiver;
  large?: boolean;
}) {
  return (
    <img
      className={`staff-avatar portrait ${large ? "large" : ""}`}
      src={`/avatars/${caregiver.id}.png`}
      alt=""
      aria-hidden="true"
    />
  );
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={28} />
      <p>{children}</p>
    </div>
  );
}
export function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button aria-label="閉じる" className="icon-button" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{children}</div>
    </div>
  );
}
export function RecordingRow({
  recording: r,
  data,
}: {
  recording: Recording;
  data: WorkspaceResponse;
}) {
  const person = data.residents.find((p) => p.id === r.residentId);
  return (
    <Link href={`/processing/${r.id}`} className="recording-row">
      {person ? (
        <Avatar resident={person} />
      ) : (
        <span className="avatar">?</span>
      )}
      <div className="recording-person">
        <strong>{person?.name || "入居者未選択"}</strong>
        <small>
          {time(r.createdAt)}
          {r.duration > 0 && (
            <>
              {" "}
              <span>·</span> {duration(r.duration)}
            </>
          )}{" "}
          <span>·</span>{" "}
          {data.caregivers.find((c) => c.id === r.caregiverId)?.name}
          {r.source === "sd-card" && (
            <>
              {" "}
              {r.sourceName ? (
                <>
                  <span>·</span> {r.sourceName}
                </>
              ) : null}
            </>
          )}
        </small>
      </div>
      <Status value={r.status} />
      <ChevronRight size={17} />
    </Link>
  );
}
export type Action = (
  input: unknown,
  message?: string,
) => Promise<{ id: string }>;
