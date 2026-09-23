"use client";
import type { WorkspaceResponse } from "@/types";
import { ChevronRight, Upload } from "lucide-react";
import Link from "next/link";
import { Empty, PageHeading, RecordingRow } from "./shared";
export function Dashboard({
  data,
  onImport,
}: {
  data: WorkspaceResponse;
  onImport: () => void;
}) {
  const pending = data.recordings
    .filter((r) => r.status !== "completed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div className="inbox-workspace">
      <PageHeading
        title="会話を共有知識にする"
        description="録音を取り込み、内容を確認してメモリーブレインへ反映します。"
      >
        <button className="primary" onClick={onImport}>
          <Upload size={17} />
          録音ファイルを取り込む
        </button>
      </PageHeading>
      <section className="panel">
        <div className="panel-header">
          <h2>確認待ちの会話</h2>
        </div>
        {pending.map((r) => (
          <RecordingRow key={r.id} recording={r} data={data} />
        ))}
        {!pending.length && (
          <Empty>
            確認待ちの会話はありません。録音ファイルを取り込めます。
          </Empty>
        )}
      </section>
      <Link className="text-link" href="/processing">
        録音履歴を見る
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
