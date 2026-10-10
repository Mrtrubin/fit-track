import type { BodyRecord } from "@/types";

/**
 * 体重趋势分析
 * - 7日平均体重（减少单日波动）
 * - 每周平均变化
 * - 减脂/增肌速度建议（只建议，不修改目标）
 */

export interface WeeklyPoint {
  /** 周起始日期 */
  weekStart: string;
  label: string;
  avgWeight: number;
  change: number | null;
}

/** 7日平均体重（滑动窗口，仅返回有完整/部分数据的天） */
export function movingAverage7(records: BodyRecord[]): { date: string; avg: number }[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const out: { date: string; avg: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = Math.max(0, i - 6);
    const window = sorted.slice(start, i + 1);
    const avg = window.reduce((s, r) => s + r.weight_kg, 0) / window.length;
    out.push({ date: sorted[i].date, avg: Math.round(avg * 100) / 100 });
  }
  return out;
}

/** 按自然周聚合平均体重 + 相邻周变化 */
export function weeklyAverages(records: BodyRecord[]): WeeklyPoint[] {
  if (records.length === 0) return [];
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const buckets = new Map<string, { sum: number; n: number }>();

  for (const r of sorted) {
    const d = new Date(r.date + "T00:00:00");
    const day = (d.getDay() + 6) % 7; // 周一=0
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const key = monday.toISOString().slice(0, 10);
    const b = buckets.get(key) ?? { sum: 0, n: 0 };
    b.sum += r.weight_kg;
    b.n += 1;
    buckets.set(key, b);
  }

  const weeks = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const out: WeeklyPoint[] = [];
  for (let i = 0; i < weeks.length; i++) {
    const [key, b] = weeks[i];
    const avg = Math.round((b.sum / b.n) * 100) / 100;
    const prevAvg = i > 0 ? out[i - 1].avgWeight : null;
    const d = new Date(key + "T00:00:00");
    out.push({
      weekStart: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      avgWeight: avg,
      change: prevAvg !== null ? Math.round((avg - prevAvg) * 100) / 100 : null,
    });
  }
  return out;
}

export interface WeightAnalysis {
  latest: number;
  avg7: number | null;
  weeklyChange: number | null;
  /** 建议 */
  advice: string | null;
  /** 0 = 正常, 1 = 减太快, 2 = 减太慢/增太少 */
  status: "normal" | "too_fast" | "too_slow";
  trend: "down" | "up" | "flat";
}

/**
 * 综合分析（按目标给出减脂/增肌速度建议）
 * 减脂参考：每周 -0.25 ~ -1.0 kg（过快 < -1.0，过慢 > -0.25 或上升）
 */
export function analyzeWeight(records: BodyRecord[], goal: "fat_loss" | "muscle_gain" | "maintain" | "recomp" = "maintain"): WeightAnalysis {
  if (records.length === 0) {
    return { latest: 0, avg7: null, weeklyChange: null, advice: null, status: "normal", trend: "flat" };
  }
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1].weight_kg;
  const weeks = weeklyAverages(sorted);
  const week = weeks[weeks.length - 1];

  if (!week || weeks.length < 2) {
    return { latest, avg7: null, weeklyChange: null, advice: null, status: "normal", trend: "flat" };
  }

  // 最近一周与上一周的平均变化
  const weeklyChange = week.change;

  let advice: string | null = null;
  let status: WeightAnalysis["status"] = "normal";
  let trend: WeightAnalysis["trend"] = "flat";

  if (weeklyChange === null) {
    return { latest, avg7: week.avgWeight, weeklyChange: null, advice: null, status: "normal", trend: "flat" };
  }

  if (goal === "fat_loss") {
    if (weeklyChange < -1.0) {
      advice = "近期体重下降较快（超过 1kg/周），可以考虑适当提高热量（约 +100~200 kcal），避免肌肉流失。";
      status = "too_fast";
      trend = "down";
    } else if (weeklyChange >= 0) {
      advice = "近期体重变化较慢或略有上升，可以考虑减少 100-200 kcal 或增加日常活动量。";
      status = "too_slow";
      trend = "up";
    } else {
      advice = "减脂速度处于合理区间（约 -0.25~-1 kg/周），继续保持。";
      status = "normal";
      trend = "down";
    }
  } else if (goal === "muscle_gain") {
    if (weeklyChange > 0.6) {
      advice = "增肌期体重增长偏快，脂肪堆积可能较多，可适当减少 100-200 kcal。";
      status = "too_fast";
      trend = "up";
    } else if (weeklyChange <= 0) {
      advice = "体重没有增长，建议增加 100-200 kcal 或检查训练强度与蛋白摄入。";
      status = "too_slow";
      trend = "flat";
    } else {
      advice = "增肌速度合理（约 +0.2~0.5 kg/周），继续保持。";
      status = "normal";
      trend = "up";
    }
  } else {
    // 维持 / 重组：关注波动
    if (weeklyChange > 0.5) {
      advice = "体重上升较多，注意热量摄入是否超出维持需求。";
      status = "too_fast";
      trend = "up";
    } else if (weeklyChange < -0.5) {
      advice = "体重下降较多，注意热量摄入是否低于维持需求。";
      status = "too_slow";
      trend = "down";
    } else {
      advice = "体重保持稳定，符合维持目标。";
      status = "normal";
      trend = "flat";
    }
  }

  return {
    latest,
    avg7: week.avgWeight,
    weeklyChange,
    advice,
    status,
    trend,
  };
}
