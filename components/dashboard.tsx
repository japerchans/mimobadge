"use client";
import { ja } from "@/lib/ja";
import type { Information, WorkspaceResponse } from "@/types";
import { Cable, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Empty, PageHeading, RecordingRow } from "./shared";
export function Dashboard({
  data,
  onTransfer,
}: {
  data: WorkspaceResponse;
  onTransfer: () => void;
  inspect: (item: Information) => void;
}) {
  const pending = data.recordings
    .filter((r) => r.status !== "completed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div className="inbox-workspace">
      <PageHeading
        title="確認待ち"
        description="会話から整理された内容を確認して、介護記録に残します。"
      >
        <button onClick={onTransfer}>
          <Cable size={17} />
          デモ録音を追加
        </button>
      </PageHeading>
      <section className="panel">
        <div className="panel-header">
          <h2>未確認の録音</h2>
          <span className="muted small">古い録音から表示</span>
        </div>
        {pending.map((r) => (
          <RecordingRow key={r.id} recording={r} data={data} />
        ))}
        {!pending.length && <Empty>未確認の録音はありません。</Empty>}
      </section>
      <p className="inbox-help">
        入居者ごとの記録やプロフィールは、左の名前から開けます。
      </p>
      <Link className="text-link" href="/records">
        確定した介護記録を見る
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
