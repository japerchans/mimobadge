"use client";
import { ja } from "@/lib/ja";
import { useState } from "react";
export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/session", {
              method: "POST",
              body: new FormData(e.currentTarget),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            window.location.assign("/");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <img src="/icon.svg" width="40" height="40" alt="" />
        <h1>こころん</h1>
        <p>施設のデモ環境にログインします。</p>
        <label>
          施設のアクセスコード
          <input
            name="code"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p role="alert" className="error">
            {ja(error)}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy ? "ログイン中…" : "ログイン"}
        </button>
        <p className="muted small">
          架空のデモデータを使用しています。アクセスコードは管理者に確認してください。
        </p>
      </form>
    </main>
  );
}
