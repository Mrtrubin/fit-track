/**
 * 全局数据类型定义
 * 结构完全对齐未来 Supabase 迁移方案（表名、字段名、user_id 隔离）。
 * 当前阶段使用 LocalStorage 实现，但表结构遵循 Supabase 规范。
 */

/** 性别 */
export type Gender = "male" | "female";

/** 活动水平 */
export type ActivityLevel = "sedentary" | "light" | "moderate" | "high" | "athlete";

/** 健身目标 */
export type GoalType = "fat_loss" | "muscle_gain" | "maintain" | "recomp";

/** 训练水平 */
export type TrainingLevel = "beginner" | "intermediate" | "advanced";

/** 减脂节奏 */
export type FatLossPace = "mild" | "standard" | "aggressive";

/** 增肌节奏 */
export type MuscleGainPace = "mild" | "standard";

/** 每餐类型 */
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

/** 训练肌肉群分类 */
export type MuscleCategory =
  | "chest"
  | "back"
  | "shoulders"
  | "legs"
  | "glutes"
  | "biceps"
  | "triceps"
  | "abs"
  | "cardio";

/** 器械类型 */
export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "smith"
  | "bodyweight"
  | "cardio";

/** 难度 */
export type Difficulty = "beginner" | "intermediate" | "advanced";

/** ========== 用户表（users） ========== */
export interface User {
  id: string;
  created_at: string;
  updated_at: string;
}

/** ========== 个人资料表（profiles） ========== */
export interface Profile {
  id: string;
  user_id: string;
  name: string;
  gender: Gender;
  age: number;
  height_cm: number;
  weight_kg: number;
  /** 体脂率，可选 */
  body_fat_pct: number | null;
  activity_level: ActivityLevel;
  /** 每周训练次数 */
  training_days_per_week: number;
  /** 每次训练时长（分钟） */
  training_minutes_per_session: number;
  goal: GoalType;
  created_at: string;
  updated_at: string;
}

/** ========== 目标表（goals） ========== */
export interface Goal {
  id: string;
  user_id: string;
  goal: GoalType;
  /** 目标热量 kcal/天 */
  target_calories: number;
  /** 蛋白质 g/天 */
  protein_g: number;
  /** 碳水 g/天 */
  carbs_g: number;
  /** 脂肪 g/天 */
  fat_g: number;
  /** 蛋白系数 g/kg */
  protein_factor: number;
  /** 脂肪系数 g/kg */
  fat_factor: number;
  /** 减脂/增肌节奏，仅相关目标使用 */
  pace?: FatLossPace | MuscleGainPace;
  updated_at: string;
}

/** ========== 食物表（foods） ========== */
export interface Food {
  id: string;
  user_id: string | null; // null = 系统预置食物
  name: string;
  category: string;
  brand: string | null;
  /** 每100g */
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  /** 常用一份量 g */
  serving_size: number;
  source: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

/** ========== 每日饮食记录（daily_food_logs） ========== */
export interface DailyFoodLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

/** ========== 食物日志明细（food_log_items） ========== */
export interface FoodLogItem {
  id: string;
  log_id: string; // 关联 daily_food_logs.id
  user_id: string;
  food_id: string;
  meal_type: MealType;
  /** 实际重量 g */
  grams: number;
  created_at: string;
}

/** ========== 健身动作表（exercises） ========== */
export interface Exercise {
  id: string;
  name: string;
  category: MuscleCategory;
  primary_muscle: string;
  secondary_muscle: string | null;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  common_mistakes: string[];
  recommended_sets: number;
  recommended_reps: string;
  recommended_rest_sec: number;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
}

/** ========== 训练计划表（workout_plans） ========== */
export interface WorkoutPlan {
  id: string;
  user_id: string | null; // null = 系统模板
  name: string;
  level: TrainingLevel;
  goal: GoalType;
  days_per_week: number;
  description: string;
  is_custom: boolean;
  created_at: string;
}

/** ========== 训练计划动作（workout_plan_exercises） ========== */
export interface WorkoutPlanExercise {
  id: string;
  plan_id: string;
  /** 第几天（1..n） */
  day: number;
  /** 训练部位标签，如"胸 + 三头" */
  body_part: string;
  exercise_id: string;
  sets: number;
  reps: string;
  /** RIR 范围，如 "1-3" */
  rir: string;
  /** 休息时间（秒） */
  rest_sec: number;
  sort_order: number;
}

/** ========== 训练会话（workout_sessions） ========== */
export interface WorkoutSession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  /** 计划名或部位名 */
  title: string;
  body_parts: string;
  duration_min: number | null;
  notes: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
}

/** ========== 训练组（workout_sets） ========== */
export interface WorkoutSet {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  /** 组序号 */
  set_number: number;
  /** 重量 kg */
  weight_kg: number;
  /** 次数 */
  reps: number;
  /** RPE 1-10，可选 */
  rpe: number | null;
  /** RIR 0-10，可选 */
  rir: number | null;
  /** 目标组数/次数（快照，供渐进超负荷参考） */
  target_sets: number;
  target_reps: string;
  created_at: string;
}

/** ========== 身体数据（body_records） ========== */
export interface BodyRecord {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  weight_kg: number;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hip_cm: number | null;
  thigh_cm: number | null;
  arm_cm: number | null;
  created_at: string;
}

/** ========== 每日热量记录（daily_calories） ========== */
export interface DailyCalories {
  id: string;
  user_id: string;
  date: string;
  /** 力量训练分钟（估算用） */
  strength_min: number;
  /** 有氧分钟 */
  cardio_min: number;
  /** 主动消耗估算值 */
  exercise_burn_est: number;
  created_at: string;
  updated_at: string;
}
