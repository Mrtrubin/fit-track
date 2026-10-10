import type { ActivityLevel, FatLossPace, GoalType, MuscleGainPace } from "@/types";
import {
  ACTIVITY_FACTORS,
  FAT_LOSS_PACES,
  MIN_SAFE_CALORIES,
  MUSCLE_GAIN_PACES,
} from "@/lib/constants";

/**
 * 热量计算：BMR / TDEE / 目标热量
 * BMR 使用 Mifflin-St Jeor 公式。
 */

export interface BmrInput {
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  age: number;
}

/** 基础代谢 BMR（Mifflin-St Jeor） */
export function calcBmr({ gender, weightKg, heightCm, age }: BmrInput): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

/** 每日总消耗 TDEE */
export function calcTdee(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activity]);
}

export type TargetCaloriesMode = { goal: GoalType } & (
  | { goal: "fat_loss"; pace: FatLossPace }
  | { goal: "muscle_gain"; pace: MuscleGainPace }
  | { goal: "maintain" }
  | { goal: "recomp" }
);

/** 计算目标热量，并给出是否异常偏低警告 */
export function calcTargetCalories(tdee: number, mode: TargetCaloriesMode): { calories: number; warning: string | null } {
  let calories: number;
  switch (mode.goal) {
    case "fat_loss":
      calories = tdee + FAT_LOSS_PACES[mode.pace].offset;
      break;
    case "muscle_gain":
      calories = tdee + MUSCLE_GAIN_PACES[mode.pace].offset;
      break;
    case "maintain":
      calories = tdee;
      break;
    case "recomp":
      // 身体重组：接近 TDEE，温和热量差
      calories = tdee - 100;
      break;
    default:
      calories = tdee;
  }

  let warning: string | null = null;
  if (calories < MIN_SAFE_CALORIES) {
    warning = `目标热量 ${calories} kcal 偏低（低于安全线 ${MIN_SAFE_CALORIES} kcal），可能导致肌肉流失和营养不良。建议适当提高热量，或复核输入的身体数据。`;
  }
  return { calories: Math.round(calories), warning };
}
