"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncAfterAuth, refreshCloudState } from "@/lib/sync/supabaseSync";
import { seedIfNeeded } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";

/**
 * 登录门禁：未登录访问受保护页面时自动跳转 /login。
 * /login、/setup（初始化向导）放行。
 * Supabase 未配置时（纯本地模式）不强制登录。
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const publicPaths = ["/login", "/setup"];
  const isPublic = publicPaths.some((p) => pathname.startsWith(p));

  useEffect(() => {
    // 未配置 Supabase：保持现有纯本地模式，不强制登录
    if (!isSupabaseConfigured()) {
      seedIfNeeded();
      setReady(true);
      return;
    }
    if (isPublic) {
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      if (!sb) {
        setReady(true);
        return;
      }
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        router.replace("/login");
        return;
      }
      // 已登录：完成首次数据绑定/同步
      seedIfNeeded();
      await syncAfterAuth();
      await refreshCloudState();
      notifyDataChanged();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, isPublic, router]);

  // 未配置 Supabase 或公共路径：直接渲染
  if (!isSupabaseConfigured() || isPublic) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-3">
        加载中…
      </div>
    );
  }
  return <>{children}</>;
}
