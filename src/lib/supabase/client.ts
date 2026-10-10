/**
 * Supabase 客户端（惰性初始化）
 * 启用条件：.env.local 中配置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 未配置时 getSupabase() 返回 null，应用保持纯本地（LocalStorage）模式。
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let initTried = false;

export function getSupabase(): SupabaseClient | null {
  if (initTried) return client;
  initTried = true;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/** 是否已配置 Supabase（未配置说明未启用云端） */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** 当前 Supabase 会话用户（登录后才可用于云端同步） */
export async function getSessionUser(): Promise<{ id: string; email?: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const user = data.session?.user ?? null;
  if (!user) return null;
  return { id: user.id, email: user.email };
}
