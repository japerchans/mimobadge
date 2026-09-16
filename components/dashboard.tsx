"use client";
import type { WorkspaceResponse } from "@/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Empty, PageHeading, RecordingRow } from "./shared";
export function Dashboard({ data }: { data: WorkspaceResponse }) {
  const pending = data.recordings
    .filter((r) => r.status !== "completed")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div className="inbox-workspace">
      <PageHeading
        title="確認待ち"
        description="録音を選んで内容を確認します。"
      />
      <section className="panel">
        <div className="panel-header">
          <h2>確認する録音</h2>
        </div>
        {pending.map((r) => (
          <RecordingRow key={r.id} recording={r} data={data} />
        ))}
        {!pending.length && <Empty>未確認の録音はありません。</Empty>}
      </section>
      <Link className="text-link" href="/processing">
        録音履歴を見る
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
