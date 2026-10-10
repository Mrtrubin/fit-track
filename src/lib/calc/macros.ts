import { DEFAULT_FAT_FACTOR, KCAL_PER_GRAM } from "@/lib/constants";

/**
 * 宏量营养分配：蛋白质 / 脂肪 / 碳水
 * 蛋白质 = 体重 × 系数；脂肪 = 体重 × 0.8；剩余热量给碳水。
 */

export interface MacrosInput {
  weightKg: number;
  targetCalories: number;
  proteinFactor: number;
  fatFactor?: number;
}

export interface MacrosResult {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  protein_kcal: number;
  fat_kcal: number;
  carbs_kcal: number;
  /** 碳水是否被挤压（热量过低时碳水为0） */
  carbs_capped: boolean;
}

export function calcMacros({
  weightKg,
  targetCalories,
  proteinFactor,
  fatFactor = DEFAULT_FAT_FACTOR,
}: MacrosInput): MacrosResult {
  const protein_g = Math.round(weightKg * proteinFactor);
  const fat_g = Math.round(weightKg * fatFactor);

  const protein_kcal = protein_g * KCAL_PER_GRAM.protein;
  const fat_kcal = fat_g * KCAL_PER_GRAM.fat;

  let carbs_kcal = targetCalories - protein_kcal - fat_kcal;
  let carbs_capped = false;
  if (carbs_kcal < 0) {
    carbs_kcal = 0;
    carbs_capped = true;
  }
  const carbs_g = Math.round(carbs_kcal / KCAL_PER_GRAM.carbs);

  return {
    protein_g,
    fat_g,
    carbs_g,
    protein_kcal,
    fat_kcal,
    carbs_kcal,
    carbs_capped,
  };
}
