/**
 * Supabase 云端同步桥
 * 架构：LocalStorage 为运行时数据源（秒开、离线可用），Supabase 为持久层。
 * - 写操作：本地先写 → 异步推送云端（upsert on id）
 * - 首次绑定/登录：把本地数据全量推送云端（云端无该用户数据时）
 * - 多设备：新设备登录后本地表为空，拉取云端填充
 * 未配置 Supabase 或未登录时全部操作静默跳过，应用保持纯本地模式。
 */
import { getSupabase, getSessionUser, isSupabaseConfigured } from "@/lib/supabase/client";

const LS_PREFIX = "fittrack:";

function readLocalRows(table: string): AnyRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + table);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as AnyRow[]) : [];
  } catch {
    return [];
  }
}

function writeLocalRows(table: string, rows: AnyRow[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
}

const CURRENT_USER_KEY = "fittrack:current_user_id";

function localUid(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

/** 用户私有表（全部按 user_id 隔离） */
export const USER_TABLES = [
  "profiles",
  "goals",
  "daily_food_logs",
  "food_log_items",
  "workout_sessions",
  "workout_sets",
  "body_records",
  "daily_calories",
] as const;

/** 系统+用户混合表（user_id 为 null 表示系统数据，用户数据按 user_id 隔离） */
export const MIXED_TABLES = ["foods", "workout_plans", "workout_plan_exercises"] as const;

/** 宽松行类型（本地表读取的通用结构） */
interface AnyRow {
  id: string;
  [k: string]: unknown;
}

/** 云端同步状态（供设置页展示） */
export interface CloudSyncState {
  configured: boolean;
  authed: boolean;
  email?: string;
  syncing: boolean;
  lastSync?: string;
  error?: string;
}

let cloudState: CloudSyncState = { configured: false, authed: false, syncing: false };
const listeners = new Set<(s: CloudSyncState) => void>();

export function getCloudState(): CloudSyncState {
  return { ...cloudState };
}

export function subscribeCloudState(fn: (s: CloudSyncState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setCloudState(patch: Partial<CloudSyncState>) {
  cloudState = { ...cloudState, ...patch };
  listeners.forEach((fn) => fn(cloudState));
}

/** 刷新状态（configured/authed/email） */
export async function refreshCloudState(): Promise<CloudSyncState> {
  cloudState.configured = isSupabaseConfigured();
  const user = await getSessionUser();
  cloudState.authed = !!user;
  cloudState.email = user?.email;
  setCloudState({});
  return getCloudState();
}

/* ============ 数据操作（云端） ============ */

/** upsert 单行（on conflict id） */
export async function pushRow(table: string, row: object): Promise<void> {
  const sb = getSupabase();
  const user = await getSessionUser();
  if (!sb || !user) return;
  const { error } = await sb.from(table as any).upsert(row as never, { onConflict: "id" });
  if (error) console.warn(`[FitTrack 云端] ${table} 推送失败:`, error.message);
}

/** 删除单行 */
export async function deleteRow(table: string, id: string): Promise<void> {
  const sb = getSupabase();
  const user = await getSessionUser();
  if (!sb || !user) return;
  const { error } = await sb.from(table as any).delete().eq("id", id);
  if (error) console.warn(`[FitTrack 云端] ${table} 删除失败:`, error.message);
}

/** 用户私有表：云端该用户的全部行 */
async function fetchUserTable(table: string, uid: string): Promise<AnyRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from(table as any).select("*").eq("user_id", uid);
  if (error) {
    console.warn(`[FitTrack 云端] ${table} 拉取失败:`, error.message);
    return [];
  }
  return (data ?? []) as AnyRow[];
}

/** 混合表：系统行 + 该用户行 */
async function fetchMixedTable(table: string, uid: string): Promise<AnyRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from(table as any).select("*").or(`user_id.is.null,user_id.eq.${uid}`);
  if (error) {
    console.warn(`[FitTrack 云端] ${table} 拉取失败:`, error.message);
    return [];
  }
  return (data ?? []) as AnyRow[];
}

/** 绑定：把本地所有数据的 user_id 替换为 auth 用户 id */
export function rebindLocalUserToAuth(authUid: string): void {
  if (typeof window === "undefined") return;
  const tables = [...USER_TABLES, ...MIXED_TABLES] as string[];
  for (const t of tables) {
    const rows = readLocalRows(t);
    if (rows.length === 0) continue;
    const changed = rows
      .filter((r) => r.user_id !== null && r.user_id !== authUid)
      .map((r) => ({ ...r, user_id: authUid }));
    if (changed.length > 0) {
      const merged = rows.map((r) =>
        r.user_id !== null && r.user_id !== authUid ? { ...r, user_id: authUid } : r,
      );
      writeLocalRows(t, merged);
    }
  }
  window.localStorage.setItem(CURRENT_USER_KEY, authUid);
}

/**
 * 全量推送本地数据到云端（绑定/首次登录时调用）
 * 仅当云端该用户无 profiles 时执行，避免覆盖云端已有数据。
 */
export async function pushAllLocal(): Promise<boolean> {
  const sb = getSupabase();
  const user = await getSessionUser();
  if (!sb || !user) return false;
  setCloudState({ syncing: true, error: undefined });
  try {
    // 云端已有该用户数据则不推送（以云端为准）
    const existing = await fetchUserTable("profiles", user.id);
    if (existing.length > 0) return false;

    for (const t of USER_TABLES) {
      const rows = readLocalRows(t);
      if (rows.length === 0) continue;
      const mine = rows.filter((r) => r.user_id === user.id || r.user_id as string | null === null);
      const { error } = await sb.from(t as any).upsert(mine as never[], { onConflict: "id" });
      if (error) console.warn(`[FitTrack 云端] ${t} 初始推送失败:`, error.message);
    }
    for (const t of MIXED_TABLES) {
      const rows = readLocalRows(t);
      if (rows.length === 0) continue;
      const mine = rows.filter((r) => r.user_id as string | null === null || r.user_id === user.id);
      const { error } = await sb.from(t as any).upsert(mine as never[], { onConflict: "id" });
      if (error) console.warn(`[FitTrack 云端] ${t} 初始推送失败:`, error.message);
    }
    setCloudState({ syncing: false, lastSync: new Date().toISOString() });
    return true;
  } catch (e) {
    setCloudState({ syncing: false, error: String(e) });
    return false;
  }
}

/**
 * 从云端拉取数据到本地（新设备首次登录时调用）
 * 安全合并：仅当本地表为空时填充，避免覆盖本地已有数据。
 */
export async function pullAllFromCloud(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  setCloudState({ syncing: true, error: undefined });
  try {
    for (const t of USER_TABLES) {
      const local = readLocalRows(t);
      if (local.length > 0) continue; // 本地已有数据，保留本地
      const rows = await fetchUserTable(t, user.id);
      if (rows.length > 0) writeLocalRows(t, rows);
    }
    for (const t of MIXED_TABLES) {
      const local = readLocalRows(t);
      if (local.length > 0) continue;
      const rows = await fetchMixedTable(t, user.id);
      if (rows.length > 0) writeLocalRows(t, rows);
    }
    setCloudState({ syncing: false, lastSync: new Date().toISOString() });
    return true;
  } catch (e) {
    setCloudState({ syncing: false, error: String(e) });
    return false;
  }
}

/** 登录/注册后的完整同步流程：绑定 uid → 推送或拉取 */
export async function syncAfterAuth(): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  // 本地 user_id 与 auth uid 不一致时先绑定（本地数据归属迁移到该账号）
  const uid = localUid();
  if (uid && uid !== user.id) {
    rebindLocalUserToAuth(user.id);
  } else if (!uid) {
    window.localStorage.setItem(CURRENT_USER_KEY, user.id);
  }
  const pushed = await pushAllLocal();
  if (!pushed) {
    await pullAllFromCloud();
  }
  await refreshCloudState();
}
