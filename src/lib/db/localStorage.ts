/**
 * LocalStorage 数据库引擎
 * 结构对齐 Supabase：每个"表"一个 key，存对象数组，字段与 types 一致。
 * 未来迁移 Supabase 时，仅需替换 lib/db/index.ts 中的实现，接口保持不变。
 */

const PREFIX = "fittrack:";

/** 表名枚举（对齐 Supabase 表） */
export const TABLES = [
  "users",
  "profiles",
  "foods",
  "daily_food_logs",
  "food_log_items",
  "exercises",
  "workout_plans",
  "workout_plan_exercises",
  "workout_sessions",
  "workout_sets",
  "body_records",
  "goals",
  "daily_calories",
] as const;

export type TableName = (typeof TABLES)[number];

export interface RowWithId {
  id: string;
}

function keyOf(table: TableName): string {
  return `${PREFIX}${table}`;
}

/** 读取整表 */
export function readTable<T extends RowWithId>(table: TableName): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyOf(table));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as T[]) : [];
  } catch {
    return [];
  }
}

/** 覆写整表 */
export function writeTable<T extends RowWithId>(table: TableName, rows: T[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyOf(table), JSON.stringify(rows));
}

/** 生成 id */
export function genId(prefix = "id"): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

/** 当前日期 YYYY-MM-DD（本地时区） */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO 时间 */
export function nowISO(): string {
  return new Date().toISOString();
}

/** 通用表 CRUD（按表名） */
export function tableOps<T extends RowWithId>(table: TableName) {
  return {
    all(): T[] {
      return readTable<T>(table);
    },
    byId(id: string): T | undefined {
      return readTable<T>(table).find((r) => r.id === id);
    },
    byUser(userId: string): T[] {
      return readTable<T>(table).filter((r) => (r as { user_id?: string | null }).user_id === userId);
    },
    insert(row: T): T {
      const rows = readTable<T>(table);
      rows.push(row);
      writeTable(table, rows);
      return row;
    },
    insertMany(rows: T[]): T[] {
      const all = readTable<T>(table);
      all.push(...rows);
      writeTable(table, all);
      return rows;
    },
    update(id: string, patch: Partial<T>): T | undefined {
      const rows = readTable<T>(table);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return undefined;
      rows[idx] = { ...rows[idx], ...patch };
      writeTable(table, rows);
      return rows[idx];
    },
    remove(id: string): void {
      writeTable(
        table,
        readTable<T>(table).filter((r) => r.id !== id),
      );
    },
    removeWhere(pred: (r: T) => boolean): void {
      writeTable(
        table,
        readTable<T>(table).filter((r) => !pred(r)),
      );
    },
  };
}
