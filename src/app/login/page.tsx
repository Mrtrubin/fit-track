"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { syncAfterAuth, refreshCloudState } from "@/lib/sync/supabaseSync";
import { notifyDataChanged } from "@/store/dbStore";
import { Card } from "@/components/ui/Card";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email || password.length < 6) {
      setMsg("请输入邮箱和至少 6 位密码");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const sb = getSupabase();
      if (!sb) {
        setMsg("云端未配置，请联系管理员");
        return;
      }
      const res =
        mode === "signup"
          ? await sb.auth.signUp({ email, password })
          : await sb.auth.signInWithPassword({ email, password });
      if (res.error) {
        setMsg(res.error.message);
        return;
      }
      if (mode === "signup" && !res.data.session) {
        setMsg("注册成功，请到邮箱确认后重新登录");
        return;
      }
      await syncAfterAuth();
      await refreshCloudState();
      notifyDataChanged();
      router.replace("/");
    } catch (e) {
      setMsg(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-ink">我的健身 · FitTrack</h1>
        <p className="mt-2 text-sm text-ink-3">登录后同步你的健身数据</p>
      </div>

      <Card className="p-5">
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode("signin")}
            className={`rounded-xl py-2.5 text-sm font-semibold ${
              mode === "signin" ? "bg-brand text-white" : "border border-line text-ink"
            }`}
          >
            登录
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`rounded-xl py-2.5 text-sm font-semibold ${
              mode === "signup" ? "bg-brand text-white" : "border border-line text-ink"
            }`}
          >
            注册
          </button>
        </div>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="邮箱"
          autoComplete="email"
          className="mb-3 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="密码（至少 6 位）"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="mb-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
        />

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? "处理中…" : mode === "signup" ? "注册并进入" : "登录并进入"}
        </button>
        {msg && <p className="mt-3 text-xs text-ink-2">{msg}</p>}
      </Card>

      <p className="mt-6 text-center text-[11px] text-ink-3">
        数据通过 Supabase 云端同步，各用户数据相互隔离
      </p>
    </div>
  );
}
