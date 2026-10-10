/**
 * 数据导出工具：JSON 全量备份 / CSV 明细导出
 */
import {
  getAllDayEntries,
  getBodyRecords,
  getFoods,
  getSessions,
  getSessionSets,
} from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 导出全部数据为 JSON（含导出时间与版本） */
export function exportAllJSON(): void {
  const tables: Record<string, unknown> = {};
  const keys = [
    "profiles", "goals", "foods", "daily_food_logs", "food_log_items",
    "exercises", "workout_plans", "workout_plan_exercises", "workout_sessions",
    "workout_sets", "body_records", "daily_calories",
  ];
  for (const k of keys) {
    try {
      tables[k] = JSON.parse(window.localStorage.getItem(`fittrack:${k}`) ?? "[]");
    } catch {
      tables[k] = [];
    }
  }
  const payload = {
    app: "FitTrack 我的健身",
    version: "0.2",
    exported_at: new Date().toISOString(),
    tables,
  };
  download(`fittrack-backup-${todayStr()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function toCSV(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

/** 导出身体数据 CSV */
export function exportBodyCSV(): void {
  const recs = getBodyRecords();
  const rows: (string | number)[][] = [
    ["日期", "体重kg", "体脂%", "腰围cm", "胸围cm", "臀围cm", "大腿围cm", "手臂围cm"],
    ...recs.map((r) => [
      r.date, r.weight_kg, r.body_fat_pct ?? "", r.waist_cm ?? "", r.chest_cm ?? "",
      r.hip_cm ?? "", r.thigh_cm ?? "", r.arm_cm ?? "",
    ]),
  ];
  download(`fittrack-body-${todayStr()}.csv`, toCSV(rows), "text/csv");
}

/** 导出饮食记录 CSV（最近 30 天） */
export function exportDietCSV(): void {
  const rows: (string | number)[][] = [
    ["日期", "餐次", "食物", "重量g", "热量kcal", "蛋白质g", "碳水g", "脂肪g"],
  ];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = todayStr(d);
    for (const e of getAllDayEntries(date)) {
      rows.push([
        date, e.item.meal_type, e.food.name, e.item.grams,
        Math.round(e.calories), Math.round(e.protein), Math.round(e.carbs), Math.round(e.fat),
      ]);
    }
  }
  download(`fittrack-diet-${todayStr()}.csv`, toCSV(rows), "text/csv");
}

/** 导出训练记录 CSV（最近 60 天） */
export function exportWorkoutCSV(): void {
  const rows: (string | number)[][] = [
    ["日期", "训练", "动作", "组", "重量kg", "次数", "RPE", "RIR", "目标"],
  ];
  const sessions = getSessions().slice(0, 60);
  for (const s of sessions) {
    for (const st of getSessionSets(s.id)) {
      rows.push([
        s.date, s.title, st.exercise_name, st.set_number, st.weight_kg, st.reps,
        st.rpe ?? "", st.rir ?? "", `${st.target_sets}×${st.target_reps}`,
      ]);
    }
  }
  download(`fittrack-workout-${todayStr()}.csv`, toCSV(rows), "text/csv");
}

/** 导出食物库 CSV */
export function exportFoodsCSV(): void {
  const rows: (string | number)[][] = [
    ["名称", "品牌", "分类", "每100g热量", "蛋白质", "碳水", "脂肪", "膳食纤维"],
    ...getFoods().map((f) => [
      f.name, f.brand ?? "", f.category, f.calories_per_100g,
      f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g, f.fiber_per_100g,
    ]),
  ];
  download(`fittrack-foods-${todayStr()}.csv`, toCSV(rows), "text/csv");
}
