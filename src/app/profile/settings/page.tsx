"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resetAll } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import {
  exportAllJSON,
  exportBodyCSV,
  exportDietCSV,
  exportFoodsCSV,
  exportWorkoutCSV,
} from "@/lib/exportData";
import { getSupabase } from "@/lib/supabase/client";
import {
  getCloudState,
  refreshCloudState,
  subscribeCloudState,
  syncAfterAuth,
  pushAllLocal,
  pullAllFromCloud,
} from "@/lib/sync/supabaseSync";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";

type AuthMode = "signin" | "signup";

export default function SettingsPage() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [state, setState] = useState(getCloudState());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("signin");
  const [authMsg, setAuthMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void refreshCloudState().then(setState);
    return subscribeCloudState(setState);
  }, []);

  function handleReset() {
    resetAll();
    router.push("/");
    router.refresh();
  }

  async function handleAuth() {
    if (!email || password.length < 6) {
      setAuthMsg("请输入邮箱和至少 6 位密码");
      return;
    }
    setBusy(true);
    setAuthMsg("");
    try {
      const sb = getSupabase();
      if (!sb) {
        setAuthMsg("未配置 Supabase，无法登录");
        return;
      }
      const res =
        mode === "signup"
          ? await sb.auth.signUp({ email, password })
          : await sb.auth.signInWithPassword({ email, password });
      if (res.error) {
        setAuthMsg(res.error.message);
        return;
      }
      if (mode === "signup" && !res.data.session) {
        setAuthMsg("注册成功，请到邮箱确认后登录");
        return;
      }
      await syncAfterAuth();
      notifyDataChanged();
      setAuthMsg("已连接云端，正在同步数据…");
    } catch (e) {
      setAuthMsg(String(e));
    } finally {
      setBusy(false);
      await refreshCloudState().then(setState);
    }
  }

  async function handleSignOut() {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    await sb.auth.signOut();
    await refreshCloudState().then(setState);
    setBusy(false);
  }

  async function handleSyncNow() {
    setBusy(true);
    setAuthMsg("");
    const pushed = await pushAllLocal();
    if (!pushed) await pullAllFromCloud();
    notifyDataChanged();
    setAuthMsg("同步完成");
    setBusy(false);
    await refreshCloudState().then(setState);
  }

  return (
    <PageContainer title="设置" back>
      {/* 云端同步 */}
      <SectionTitle title="云端同步（Supabase）" />
      <Card className="mb-5">
        {!state.configured ? (
          <div className="text-sm leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">未启用云端同步</p>
            <p className="mt-1">
              当前数据仅保存在本机浏览器。如需多设备同步：
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px]">
              <li>在 Supabase 创建项目，打开 SQL Editor 执行项目内 <code className="rounded bg-surface-2 px-1">supabase/schema.sql</code></li>
              <li>在项目根目录新建 <code className="rounded bg-surface-2 px-1">.env.local</code>，填入项目 URL 与 anon key</li>
              <li>回到本页登录邮箱账号即可同步</li>
            </ol>
          </div>
        ) : !state.authed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">登录云端账号</span>
              <span className="flex items-center gap-1 text-xs text-ink-3">
                <span className="h-1.5 w-1.5 rounded-full bg-warn" />
                未登录
              </span>
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="邮箱"
              autoComplete="email"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="密码（至少 6 位）"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
                  mode === "signin" ? "bg-brand text-white" : "border border-line text-ink"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${
                  mode === "signup" ? "bg-brand text-white" : "border border-line text-ink"
                }`}
              >
                注册
              </button>
            </div>
            <button
              onClick={handleAuth}
              disabled={busy}
              className="w-full rounded-xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "处理中…" : mode === "signup" ? "注册并同步" : "登录并同步"}
            </button>
            {authMsg && <p className="text-xs text-ink-2">{authMsg}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">已连接云端</span>
              <span className="flex items-center gap-1 text-xs text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {state.email}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink-3">
              {state.lastSync
                ? `最近同步：${new Date(state.lastSync).toLocaleString()}`
                : "本地数据已绑定该账号，写入会自动同步到云端"}
            </p>
            {state.error && <p className="text-xs text-danger">同步异常：{state.error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSyncNow}
                disabled={busy}
                className="flex-1 rounded-xl bg-brand py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                {busy ? "同步中…" : "立即同步"}
              </button>
              <button
                onClick={handleSignOut}
                disabled={busy}
                className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink disabled:opacity-50"
              >
                退出登录
              </button>
            </div>
            {authMsg && <p className="text-xs text-ink-2">{authMsg}</p>}
          </div>
        )}
      </Card>

      <SectionTitle title="数据说明" />
      <Card className="mb-5">
        <p className="text-sm leading-relaxed text-ink-2">
          数据保存在<b className="text-ink">本机浏览器</b>（LocalStorage），按用户隔离，本地数据永不丢失；
          启用云端后写入会同时同步到 Supabase，实现多设备备份与同步，数据库启用 Row Level Security 保证用户数据隔离。
        </p>
      </Card>

      <SectionTitle title="数据导出" />
      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={exportAllJSON}
            className="rounded-xl bg-brand px-3 py-2.5 text-sm font-bold text-white active:opacity-90"
          >
            完整备份（JSON）
          </button>
          <button
            onClick={exportBodyCSV}
            className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink active:bg-surface-2"
          >
            身体数据（CSV）
          </button>
          <button
            onClick={exportDietCSV}
            className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink active:bg-surface-2"
          >
            饮食记录（CSV）
          </button>
          <button
            onClick={exportWorkoutCSV}
            className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink active:bg-surface-2"
          >
            训练记录（CSV）
          </button>
          <button
            onClick={exportFoodsCSV}
            className="col-span-2 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink active:bg-surface-2"
          >
            食物库（CSV）
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-3">
          JSON 完整备份包含全部数据，可用于迁移与存档；CSV 可用 Excel/WPS 打开。
        </p>
      </Card>

      <SectionTitle title="数据管理" />
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink">清空所有数据</p>
            <p className="text-xs text-ink-3">删除全部记录并重新初始化，不可恢复</p>
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg border border-danger/30 px-3 py-1.5 text-sm font-semibold text-danger active:bg-danger/5"
            >
              清空
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink"
              >
                取消
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white"
              >
                确认清空
              </button>
            </div>
          )}
        </div>
      </Card>

      <SectionTitle title="关于" />
      <Card>
        <p className="text-sm font-semibold text-ink">我的健身 · FitTrack</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-3">
          个人健身管理系统 · v0.2（云端版）
          <br />
          记录饮食热量、训练重量与身体变化，科学渐进超负荷。
        </p>
      </Card>
    </PageContainer>
  );
}
