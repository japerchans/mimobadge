"use client";
import { ja } from "@/lib/ja";
import type { Information, WorkspaceResponse } from "@/types";
import {
  ArrowRightLeft,
  AudioLines,
  Cable,
  Check,
  ChevronRight,
  FileText,
  LayoutDashboard,
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Dashboard } from "./dashboard";
import {
  Handoffs,
  Recordings,
  Records,
  Residents,
  SettingsPage,
  Staff,
} from "./facility-views";
import { InformationDetail } from "./information-detail";
import { RecordingWorkspace } from "./recording-workspace";
import { ResidentWorkspace } from "./resident-workspace";
import { Avatar, Empty, formatDate, Modal } from "./shared";
export const nav = [
  { href: "/", label: "確認待ち", icon: LayoutDashboard },
  { href: "/processing", label: "録音一覧", icon: AudioLines },
  { href: "/records", label: "介護記録", icon: FileText },
  { href: "/handoffs", label: "申し送り", icon: ArrowRightLeft },
];
export function WorkspaceApp() {
  const [data, setData] = useState<WorkspaceResponse | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [transfer, setTransfer] = useState(false);
  const [selected, setSelected] = useState("tanaka");
  const [busy, setBusy] = useState(false);
  const [item, setItem] = useState<Information | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const refresh = useCallback(async () => {
    const res = await fetch("/api/workspace", { cache: "no-store" });
    if (res.status === 401) {
      window.location.assign("/login");
      return;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(ja(json.error));
    setData(json);
  }, []);
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(""), 4500);
      return () => clearTimeout(id);
    }
  }, [toast]);
  const action = async (input: unknown, message?: string) => {
    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(ja(result.error));
    await refresh();
    if (message) setToast(message);
    return result as { id: string };
  };
  if (!data)
    return (
      <main className="boot">
        <img src="/icon.svg" width="42" height="42" alt="" />
        <h1>みもバッジ</h1>
        {error ? (
          <>
            <p role="alert">{ja(error)}</p>
            <button
              onClick={() => {
                setError("");
                refresh().catch((e) => setError(e.message));
              }}
            >
              再読み込み
            </button>
          </>
        ) : (
          <p>記録を読み込んでいます…</p>
        )}
      </main>
    );
  const resident = data.residents.find(
    (r) => pathname === `/residents/${r.id}`,
  );
  const recording = data.recordings.find(
    (r) => pathname === `/processing/${r.id}`,
  );
  const pending = data.recordings.filter((r) => r.status !== "completed");
  const title =
    resident?.name ||
    (recording
      ? "録音の確認"
      : {
          "/": "確認待ち",
          "/dashboard": "確認待ち",
          "/processing": "録音一覧",
          "/records": "介護記録",
          "/handoffs": "申し送り",
          "/residents": "入居者",
          "/staff": "職員",
          "/settings": "設定",
        }[pathname] || "見つかりません");
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside
        className="sidebar"
        onClick={(e) => {
          if (
            (e.target as HTMLElement).closest("a") &&
            window.matchMedia("(max-width: 680px)").matches
          )
            setCollapsed(false);
        }}
      >
        <Link className="brand" href="/">
          <img src="/icon.svg" width="32" height="32" alt="" />
          <span>
            みもバッジ<small>みもバッジ</small>
          </span>
        </Link>
        <div className="facility-switch">
          <span className="facility-symbol">S</span>
          <div>
            さくらケアホーム<small>介護記録</small>
          </div>
        </div>
        <label className="search">
          <Search size={16} />
          <input
            aria-label="入居者・職員を検索"
            placeholder="名前・部屋番号で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd>⌕</kbd>
        </label>
        <nav className="main-nav">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={
                pathname === n.href ||
                (n.href !== "/" && pathname.startsWith(n.href))
                  ? "active"
                  : ""
              }
            >
              <n.icon size={18} />
              {n.label}
              {n.href === "/processing" && pending.length > 0 && (
                <b className="nav-count">{pending.length}</b>
              )}
            </Link>
          ))}
        </nav>
        {search &&
          !data.residents.some((r) =>
            `${r.name} ${ja(r.kana)} ${r.room}`.includes(search),
          ) &&
          !data.caregivers.some((c) => c.name.includes(search)) && (
            <p className="search-empty" role="status">
              一致する人が見つかりません。
            </p>
          )}
        <div className="sidebar-section">
          <div className="section-label">
            <Link href="/residents">入居者</Link>
            <span>{data.residents.length}</span>
          </div>
          <div className="people-list">
            {data.residents
              .filter((r) =>
                `${r.name} ${ja(r.kana)} ${r.room}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((r) => {
                const waiting = data.recordings.filter(
                  (x) => x.residentId === r.id && x.status !== "completed",
                ).length;
                return (
                  <Link
                    key={r.id}
                    href={`/residents/${r.id}`}
                    className={
                      resident?.id === r.id || recording?.residentId === r.id
                        ? "selected"
                        : ""
                    }
                  >
                    <Avatar resident={r} />
                    <span>
                      {r.name}
                      <small>
                        {waiting
                          ? `未確認の録音 ${waiting}件`
                          : `${r.room}号室`}
                      </small>
                    </span>
                    {waiting > 0 && <span className="unread" />}
                  </Link>
                );
              })}
          </div>
        </div>
        <div className="sidebar-section staff-section">
          <div className="section-label">
            <Link href="/staff">担当職員</Link>
            <span>{data.caregivers.length}</span>
          </div>
          {data.caregivers
            .filter((c) => c.name.includes(search))
            .map((c) => (
              <Link className="staff-link" key={c.id} href={`/staff#${c.id}`}>
                <span className="staff-avatar">{c.name[0]}</span>
                <span>{c.name}</span>
                <span className="muted small">{c.badge}</span>
              </Link>
            ))}
        </div>
        <div className="sidebar-bottom">
          <Link href="/settings">
            <Settings size={17} />
            設定・利用情報
          </Link>
          <div className="current-user">
            <span className="staff-avatar">青</span>
            <div>
              青木 美咲<small>介護職員 · 日勤</small>
            </div>
            <span className="demo-chip">デモ</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button
              className="icon-button"
              aria-label="入居者一覧の表示を切り替え"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <PanelLeft size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <span className="muted">介護記録</span>
            <ChevronRight size={14} />
            <span>{title}</span>
          </div>
          <div className="row">
            <span className="top-date">
              {formatDate(new Date().toISOString(), { weekday: "short" })}
            </span>
            <span className="divider" />
            <span className="demo-label">デモ施設</span>
          </div>
        </header>
        <main className="main-content">
          {resident ? (
            <ResidentWorkspace
              key={resident.id}
              resident={resident}
              data={data}
              inspect={setItem}
            />
          ) : recording ? (
            <RecordingWorkspace
              key={recording.id}
              recording={recording}
              data={data}
              action={action}
            />
          ) : pathname === "/" || pathname === "/dashboard" ? (
            <Dashboard
              data={data}
              onTransfer={() => setTransfer(true)}
              inspect={setItem}
            />
          ) : pathname === "/processing" ? (
            <Recordings data={data} onTransfer={() => setTransfer(true)} />
          ) : pathname === "/residents" ? (
            <Residents data={data} />
          ) : pathname === "/records" ? (
            <Records data={data} />
          ) : pathname === "/handoffs" ? (
            <Handoffs data={data} action={action} />
          ) : pathname === "/staff" ? (
            <Staff data={data} />
          ) : pathname === "/settings" ? (
            <SettingsPage data={data} />
          ) : (
            <Empty>
              記録が見つかりません。 <Link href="/">確認待ちに戻る</Link>
            </Empty>
          )}
        </main>
        <footer className="app-footer">
          <span>みもバッジ</span>
          <span>架空のデータ · 日本標準時</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button aria-label="通知を閉じる" onClick={() => setToast("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {transfer && (
        <Modal title="デモ録音を追加" close={() => !busy && setTransfer(false)}>
          <div className="dialog-body">
            <div className="transfer-icon">
              <Cable size={30} />
            </div>
            <p>
              サンプルの会話を追加して、記録の確認から確定までを試せます。実際の録音は行いません。
            </p>
            <label>
              会話した入居者
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">あとで選ぶ</option>
                {data.residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · 居室 {r.room}
                  </option>
                ))}
              </select>
            </label>
            <p className="muted small">
              会話した入居者を選んでください。声の区別だけでは本人を特定できません。
            </p>
            {error && (
              <p role="alert" className="error">
                {ja(error)}
              </p>
            )}
          </div>
          <div className="dialog-actions">
            <button onClick={() => setTransfer(false)} disabled={busy}>
              キャンセル
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const result = await action(
                    { type: "transfer", residentId: selected || null },
                    "デモ録音を追加しました",
                  );
                  setTransfer(false);
                  router.push(`/processing/${result.id}`);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Cable size={16} />
              {busy ? "追加中…" : "録音を追加"}
            </button>
          </div>
        </Modal>
      )}
      {item && (
        <InformationDetail
          item={item}
          data={data}
          close={() => setItem(null)}
          action={action}
        />
      )}
    </div>
  );
}
