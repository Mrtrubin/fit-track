import type {
  ActivityLevel,
  EquipmentType,
  FatLossPace,
  GoalType,
  MuscleCategory,
  MuscleGainPace,
  TrainingLevel,
} from "@/types";

/** 活动水平 → 系数 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "久坐（很少运动）",
  light: "轻度活动（每周1-3次）",
  moderate: "中等活动（每周3-5次）",
  high: "高活动（每周6-7次）",
  athlete: "极高活动（体力劳动/每天训练）",
};

/** 目标 */
export const GOAL_LABELS: Record<GoalType, string> = {
  fat_loss: "减脂",
  muscle_gain: "增肌",
  maintain: "维持",
  recomp: "身体重组",
};

/** 减脂节奏 → 热量偏移 */
export const FAT_LOSS_PACES: Record<FatLossPace, { label: string; offset: number; desc: string }> = {
  mild: { label: "温和减脂", offset: -300, desc: "更保守，尽量保留肌肉" },
  standard: { label: "标准减脂", offset: -400, desc: "平衡速度与肌肉保留" },
  aggressive: { label: "积极减脂", offset: -500, desc: "速度更快，可能影响训练表现" },
};

/** 增肌节奏 → 热量偏移 */
export const MUSCLE_GAIN_PACES: Record<MuscleGainPace, { label: string; offset: number; desc: string }> = {
  mild: { label: "温和增肌", offset: 200, desc: "更干净地增肌，少堆积脂肪" },
  standard: { label: "标准增肌", offset: 300, desc: "较快的肌肉增长" },
};

/** 蛋白系数选项 g/kg */
export const PROTEIN_FACTORS = [1.6, 1.8, 2.0, 2.2];
/** 默认蛋白系数 */
export const DEFAULT_PROTEIN_FACTOR = 1.8;
/** 默认脂肪系数 g/kg */
export const DEFAULT_FAT_FACTOR = 0.8;

/** 食物分类 */
export const FOOD_CATEGORIES = [
  "主食",
  "肉类",
  "蛋类",
  "奶制品",
  "蔬菜",
  "水果",
  "零食",
  "饮料",
  "调味料",
  "其他",
] as const;

/** 肌肉分类 */
export const MUSCLE_CATEGORIES: { value: MuscleCategory; label: string }[] = [
  { value: "chest", label: "胸" },
  { value: "back", label: "背" },
  { value: "shoulders", label: "肩" },
  { value: "legs", label: "腿" },
  { value: "glutes", label: "臀" },
  { value: "biceps", label: "二头" },
  { value: "triceps", label: "三头" },
  { value: "abs", label: "腹部" },
  { value: "cardio", label: "有氧" },
];

export const MUSCLE_LABELS: Record<MuscleCategory, string> = MUSCLE_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<MuscleCategory, string>,
);

/** 器械类型 */
export const EQUIPMENT_TYPES: { value: EquipmentType; label: string }[] = [
  { value: "barbell", label: "杠铃" },
  { value: "dumbbell", label: "哑铃" },
  { value: "machine", label: "固定器械" },
  { value: "cable", label: "龙门架" },
  { value: "smith", label: "史密斯" },
  { value: "bodyweight", label: "自重" },
  { value: "cardio", label: "有氧器械" },
];

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = EQUIPMENT_TYPES.reduce(
  (acc, c) => ({ ...acc, [c.value]: c.label }),
  {} as Record<EquipmentType, string>,
);

/** 难度 */
export const DIFFICULTY_LABELS: Record<TrainingLevel | "beginner" | "intermediate" | "advanced", string> = {
  beginner: "入门",
  intermediate: "中等",
  advanced: "进阶",
};

/** 训练水平 */
export const TRAINING_LEVELS: { value: TrainingLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "新手", desc: "刚接触训练或训练不足3个月" },
  { value: "intermediate", label: "基础", desc: "有持续训练经验，动作较规范" },
  { value: "advanced", label: "进阶", desc: "训练1年以上，追求更高强度" },
];

/** 每餐标签 */
export const MEAL_LABELS: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

export const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

/** 宏量营养每克热量 */
export const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

/** 目标热量最低安全线（避免极端低热量） */
export const MIN_SAFE_CALORIES = 1200;
