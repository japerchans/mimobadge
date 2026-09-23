"use client";

import {
  buildStructuredCareRecord,
  summarizeCareRecord,
} from "@/domain/care-record";
import { ja } from "@/lib/ja";
import type {
  Proposal,
  Recording,
  Resident,
  StructuredCareRecord,
  WorkspaceResponse,
} from "@/types";
import { Check, ChevronRight, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CareRecordEditor } from "./care-record-view";
import { Action, Empty, formatDate, PageHeading, time } from "./shared";

type DailyDraft = {
  recording: Recording;
  proposals: Proposal[];
  draft: string;
  structuredDraft: StructuredCareRecord;
};

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

const speakerLabel = (speaker: string) =>
  speaker === "resident"
    ? "入居者"
    : speaker === "caregiver"
      ? "職員"
      : "話者不明";

export function DailyReview({
  resident,
  reportDate,
  data,
  action,
}: {
  resident: Resident;
  reportDate: string;
  data: WorkspaceResponse;
  action: Action;
}) {
  const sourceRecordings = useMemo(
    () =>
      data.recordings
        .filter(
          (recording) =>
            recording.residentId === resident.id &&
            recording.status === "review" &&
            japanDate(recording.createdAt) === reportDate,
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [data.recordings, reportDate, resident.id],
  );
  const [drafts, setDrafts] = useState<DailyDraft[]>(() =>
    sourceRecordings.map((recording) => ({
      recording,
      proposals: structuredClone(recording.proposals),
      draft: recording.draft,
      structuredDraft:
        recording.structuredDraft ||
        buildStructuredCareRecord(recording.proposals),
    })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const dateLabel = reportDate
    .split("-")
    .map(Number)
    .reduce(
      (label, part, index) => `${label}${part}${["年", "月", "日"][index]}`,
      "",
    );
  const updateDraft = (id: string, patch: Partial<DailyDraft>) =>
    setDrafts((current) =>
      current.map((item) =>
        item.recording.id === id ? { ...item, ...patch } : item,
      ),
    );
  const updateProposal = (
    recordingId: string,
    proposalId: string,
    patch: Partial<Proposal>,
  ) =>
    setDrafts((current) =>
      current.map((item) =>
        item.recording.id === recordingId
          ? {
              ...item,
              proposals: item.proposals.map((proposal) =>
                proposal.id === proposalId
                  ? { ...proposal, ...patch }
                  : proposal,
              ),
            }
          : item,
      ),
    );
  const approveDay = async () => {
    setSaving(true);
    setError("");
    try {
      await action(
        {
          type: "review-day",
          residentId: resident.id,
          reportDate,
          recordings: drafts.map((item) => ({
            id: item.recording.id,
            revision: item.recording.revision,
            draft: item.draft,
            structuredDraft: item.structuredDraft,
            proposals: item.proposals.map(({ id, content, status }) => ({
              id,
              content,
              status,
            })),
          })),
        },
        `${resident.name}さんの${dateLabel}分を確定しました`,
      );
      setDone(true);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (done)
    return (
      <section className="panel daily-review-complete">
        <span className="success-icon">
          <Check size={24} />
        </span>
        <div>
          <h2>{dateLabel}の記録を確定しました</h2>
          <p>介護記録、プロフィール、家族レポートへまとめて反映しました。</p>
        </div>
        <Link
          className="button primary"
          href={`/residents/${resident.id}/family`}
        >
          家族レポートを確認
          <ChevronRight size={16} />
        </Link>
      </section>
    );

  if (!drafts.length)
    return (
      <Empty>
        この日に確認する会話はありません。{" "}
        <Link href={`/residents/${resident.id}/records`}>介護記録を見る</Link>
      </Empty>
    );

  return (
    <div className="daily-review-page">
      <PageHeading
        eyebrow="1日1回の確認"
        title={`${dateLabel}のまとめ`}
        description={`${drafts.length}件の会話から作った介護記録とプロフィール更新を、まとめて確認します。`}
      />
      {error && (
        <p className="error" role="alert">
          {ja(error)}
        </p>
      )}
      <div className="daily-review-recordings">
        {drafts.map((item, index) => {
          const profileProposals = item.proposals.filter(
            (proposal) => proposal.kind === "profile",
          );
          return (
            <article className="panel daily-recording" key={item.recording.id}>
              <header>
                <div>
                  <span className="daily-recording-number">{index + 1}</span>
                  <div>
                    <h2>{time(item.recording.createdAt)}の会話</h2>
                    <p>
                      {formatDate(item.recording.createdAt)} ·{" "}
                      {data.caregivers.find(
                        (caregiver) =>
                          caregiver.id === item.recording.caregiverId,
                      )?.name || "担当職員"}
                    </p>
                  </div>
                </div>
                <details>
                  <summary>
                    <MessagesSquare size={16} />
                    会話を確認
                  </summary>
                  <div className="daily-transcript">
                    {item.recording.transcript.map((segment, segmentIndex) => (
                      <div
                        className={`speaker-${segment.speaker}`}
                        key={segmentIndex}
                      >
                        <strong>{speakerLabel(segment.speaker)}</strong>
                        <p>{segment.text}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </header>
              <CareRecordEditor
                record={item.structuredDraft}
                disabled={saving}
                onChange={(structuredDraft) =>
                  updateDraft(item.recording.id, {
                    structuredDraft,
                    draft: summarizeCareRecord(structuredDraft),
                  })
                }
              />
              {profileProposals.length > 0 && (
                <details className="daily-profile-candidates">
                  <summary>
                    プロフィール更新候補 {profileProposals.length}件
                  </summary>
                  {profileProposals.map((proposal) => (
                    <label key={proposal.id}>
                      <input
                        type="checkbox"
                        checked={proposal.status !== "rejected"}
                        disabled={saving}
                        onChange={(event) =>
                          updateProposal(item.recording.id, proposal.id, {
                            status: event.target.checked
                              ? "pending"
                              : "rejected",
                          })
                        }
                      />
                      <span>{ja(proposal.category)}</span>
                      <input
                        value={proposal.content}
                        disabled={saving || proposal.status === "rejected"}
                        onChange={(event) =>
                          updateProposal(item.recording.id, proposal.id, {
                            content: event.target.value,
                            status: "edited",
                          })
                        }
                      />
                    </label>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </div>
      <div className="daily-review-submit">
        <div>
          <strong>{drafts.length}件を一度に確定</strong>
          <span>確定後、今日の家族レポートも更新されます。</span>
        </div>
        <button className="primary" disabled={saving} onClick={approveDay}>
          <Check size={17} />
          {saving ? "まとめています…" : "1日分を確定して反映"}
        </button>
      </div>
    </div>
  );
}
