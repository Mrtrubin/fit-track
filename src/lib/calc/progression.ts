import type { EquipmentType } from "@/types";

/**
 * 渐进超负荷建议
 * 根据目标次数范围与完成情况，给出「增加重量 / 维持重量」建议。
 * 规则：
 * - 全部组达到目标上限且 RIR 较高 → 建议下次增加重量
 * - 多数组未达到目标下限 → 建议维持重量、优先完成次数
 * - 其余情况 → 维持
 */

export interface CompletedSet {
  reps: number;
  rir: number | null;
  weight_kg: number;
}

export type ProgressionType = "increase" | "maintain" | "reduce" | "insufficient";

export interface ProgressionAdvice {
  type: ProgressionType;
  message: string;
  /** 建议增加的重量 */
  suggestedIncrease: number | null;
}

/** 解析 "8-12" / "10-12/腿" / "30-60秒" 形式的次数目标 */
function parseRepsRange(target: string): { min: number; max: number } | null {
  const m = target.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return { min: Number(m[1]), max: Number(m[2]) };
}

/** 器械建议增重幅度 */
function suggestedStep(equipment: EquipmentType): number {
  switch (equipment) {
    case "dumbbell":
      return 2; // 1-2kg/手
    case "barbell":
      return 2.5; // 2.5-5kg
    case "machine":
      return 2.5; // 器械最小增重
    default:
      return 2.5;
  }
}

export function getProgressionAdvice(
  targetReps: string,
  sets: CompletedSet[],
  equipment: EquipmentType = "machine",
): ProgressionAdvice {
  if (sets.length === 0) {
    return { type: "insufficient", message: "记录至少一组后，系统将给出下次训练建议。", suggestedIncrease: null };
  }
  const range = parseRepsRange(targetReps);
  if (!range) {
    return { type: "insufficient", message: "该动作不计入渐进超负荷分析（如平板支撑、有氧）。", suggestedIncrease: null };
  }

  const repsArr = sets.map((s) => s.reps);
  const allAtOrAboveMax = repsArr.every((r) => r >= range.max);
  const avgBelowMin = repsArr.reduce((a, b) => a + b, 0) / repsArr.length < range.min;
  const rirs = sets.map((s) => s.rir).filter((r): r is number => r !== null && r !== undefined);
  const avgRir = rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null;

  // 全部达到上限 + RIR 较高（接近力竭的余力较多，RIR>=2 视为轻松）
  if (allAtOrAboveMax && (avgRir === null || avgRir >= 2)) {
    const step = suggestedStep(equipment);
    return {
      type: "increase",
      message: `本次已达到目标次数上限${avgRir === null ? "" : "且 RIR 较高"}，下次可以尝试增加重量（建议 +${step}kg）。`,
      suggestedIncrease: step,
    };
  }
  // 平均低于下限 → 维持
  if (avgBelowMin) {
    return {
      type: "maintain",
      message: "当前重量可能偏高，下次建议维持重量并优先完成目标次数。",
      suggestedIncrease: null,
    };
  }
  // 达到目标但 RIR 偏低（接近力竭）→ 维持
  if (allAtOrAboveMax && avgRir !== null && avgRir < 2) {
    return {
      type: "maintain",
      message: "已达目标次数但接近力竭，建议维持当前重量，下次再评估是否增重。",
      suggestedIncrease: null,
    };
  }
  return {
    type: "maintain",
    message: "继续保持当前重量，逐步向目标次数上限靠拢。",
    suggestedIncrease: null,
  };
}
