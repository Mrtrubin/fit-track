import type { FoodLogEntry } from "@/lib/db";

/**
 * 每日营养汇总 + 运动消耗估算
 */

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function sumNutrition(entries: FoodLogEntry[]): NutritionTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/**
 * 运动消耗估算（粗略，非精准）
 * 力量训练约 5 kcal/min；有氧约 7 kcal/min（以中等体重计）。
 * 实际消耗受强度、体重、心率影响，此处仅为估算参考。
 */
export function estimateExerciseBurn(strengthMin: number, cardioMin: number): number {
  return Math.round(strengthMin * 5 + cardioMin * 7);
}
