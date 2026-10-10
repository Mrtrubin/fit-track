/**
 * 业务数据访问层（Data Access Layer）
 * 当前使用 LocalStorage 实现，接口按 Supabase 表结构设计。
 * 未来迁移：仅替换本文件内部实现为 Supabase 客户端调用，页面代码不变。
 * 所有数据按 user_id 隔离。
 */

import type {
  BodyRecord,
  DailyCalories,
  DailyFoodLog,
  Exercise,
  Food,
  FoodLogItem,
  Goal,
  MealType,
  Profile,
  User,
  WorkoutPlan,
  WorkoutPlanExercise,
  WorkoutSession,
  WorkoutSet,
} from "@/types";
import { buildFoodSeed } from "@/lib/seed/foods";
import { buildExerciseSeed } from "@/lib/seed/exercises";
import { buildPopularPlans } from "@/lib/seed/popularPlans";
import { deleteRow, pushRow } from "@/lib/sync/supabaseSync";
import { genId, nowISO, readTable, tableOps, todayStr, writeTable } from "@/lib/db/localStorage";

/* ============ 当前用户 ============ */
const CURRENT_USER_KEY = "fittrack:current_user_id";

export function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CURRENT_USER_KEY);
}

export function setCurrentUserId(id: string): void {
  window.localStorage.setItem(CURRENT_USER_KEY, id);
}

/* ============ 种子初始化 ============ */
export function seedIfNeeded(): void {
  const users = readTable<User>("users");
  if (users.length === 0) {
    const user: User = { id: genId("user"), created_at: nowISO(), updated_at: nowISO() };
    writeTable("users", [user]);
    setCurrentUserId(user.id);
  }
  // 内置食物库（首次播种 + 增量补充新增系统食物，不覆盖用户数据）
  const existingFoods = readTable<Food>("foods");
  const foodNames = new Set(existingFoods.map((f) => f.name));
  const newFoods = buildFoodSeed().filter((f) => !foodNames.has(f.name));
  if (existingFoods.length === 0) {
    writeTable("foods", buildFoodSeed());
  } else if (newFoods.length > 0) {
    writeTable("foods", [...existingFoods, ...newFoods]);
  }
  // 动作库（首次播种 + 增量补充新增系统动作）
  const existingExercises = readTable<Exercise>("exercises");
  const exNames = new Set(existingExercises.map((e) => e.name));
  const newExercises = buildExerciseSeed().filter((e) => !exNames.has(e.name));
  if (existingExercises.length === 0) {
    writeTable("exercises", buildExerciseSeed());
  } else if (newExercises.length > 0) {
    writeTable("exercises", [...existingExercises, ...newExercises]);
  }
  // 热门博主计划模板（系统级模板仅在不存在任何系统模板时播种）
  const hasSystemPlans = readTable<WorkoutPlan>("workout_plans").some((p) => p.user_id === null);
  if (!hasSystemPlans) {
    for (const { plan, exercises } of buildPopularPlans()) {
      plans.insert(plan);
      planExercises.insertMany(exercises);
    }
  }
}

/** 清空所有数据（用于测试/重置） */
export function resetAll(): void {
  if (typeof window === "undefined") return;
  const tables = [
    "users", "profiles", "foods", "daily_food_logs", "food_log_items",
    "exercises", "workout_plans", "workout_plan_exercises", "workout_sessions",
    "workout_sets", "body_records", "goals", "daily_calories",
  ];
  tables.forEach((t) => window.localStorage.removeItem(`fittrack:${t}`));
  window.localStorage.removeItem(CURRENT_USER_KEY);
}

/* ============ 个人资料 profiles ============ */
const profiles = tableOps<Profile>("profiles");

export function getProfile(): Profile | null {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return profiles.byUser(uid)[0] ?? null;
}

export function saveProfile(data: Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">): Profile {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const existing = getProfile();
  const now = nowISO();
  const profile: Profile = existing
    ? { ...existing, ...data, updated_at: now }
    : { id: genId("pro"), user_id: uid, created_at: now, updated_at: now, ...data };
  if (existing) {
    profiles.update(existing.id, profile);
  } else {
    profiles.insert(profile);
  }
  void pushRow("profiles", profile);
  return profile;
}

/* ============ 目标 goals ============ */
const goals = tableOps<Goal>("goals");

export function getGoal(): Goal | null {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return goals.byUser(uid)[0] ?? null;
}

export function saveGoal(data: Omit<Goal, "id" | "user_id" | "updated_at">): Goal {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const existing = getGoal();
  const goal: Goal = existing
    ? { ...existing, ...data, updated_at: nowISO() }
    : { id: genId("goal"), user_id: uid, updated_at: nowISO(), ...data };
  if (existing) goals.update(existing.id, goal);
  else goals.insert(goal);
  void pushRow("goals", goal);
  return goal;
}

/* ============ 食物 foods ============ */
const foods = tableOps<Food>("foods");

/** 获取系统 + 用户自定义食物 */
export function getFoods(): Food[] {
  const uid = getCurrentUserId();
  return foods.all().filter((f) => f.user_id === null || f.user_id === uid);
}

export function getFoodById(id: string): Food | undefined {
  return foods.byId(id);
}

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return getFoods();
  return getFoods().filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      (f.brand && f.brand.toLowerCase().includes(q)),
  );
}

export function addCustomFood(data: Omit<Food, "id" | "user_id" | "is_custom" | "created_at" | "updated_at">): Food {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const now = nowISO();
  const food: Food = {
    ...data,
    id: genId("food"),
    user_id: uid,
    is_custom: true,
    created_at: now,
    updated_at: now,
  };
  foods.insert(food);
  void pushRow("foods", food);
  return food;
}

export function updateFood(id: string, data: Partial<Food>): Food | undefined {
  const updated = foods.update(id, { ...data, updated_at: nowISO() });
  if (updated) void pushRow("foods", updated);
  return updated;
}

export function deleteFood(id: string): void {
  foods.remove(id);
  void deleteRow("foods", id);
}

/* ============ 每日饮食 daily_food_logs + food_log_items ============ */
const dailyLogs = tableOps<DailyFoodLog>("daily_food_logs");
const foodItems = tableOps<FoodLogItem>("food_log_items");

function getOrCreateLog(userId: string, date: string): DailyFoodLog {
  const existing = dailyLogs.all().find((l) => l.user_id === userId && l.date === date);
  if (existing) return existing;
  const log: DailyFoodLog = {
    id: genId("log"),
    user_id: userId,
    date,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  dailyLogs.insert(log);
  void pushRow("daily_food_logs", log);
  return log;
}

/** 获取某天的日志（无则创建） */
export function getDailyLog(date: string): DailyFoodLog | null {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return getOrCreateLog(uid, date);
}

export interface FoodLogEntry {
  item: FoodLogItem;
  food: Food;
  /** 实际热量/营养（按重量折算） */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** 某天某餐的所有条目（含折算营养） */
export function getMealEntries(date: string, meal: MealType): FoodLogEntry[] {
  const uid = getCurrentUserId();
  const log = uid ? dailyLogs.all().find((l) => l.user_id === uid && l.date === date) : undefined;
  if (!log) return [];
  return foodItems
    .all()
    .filter((i) => i.log_id === log.id && i.meal_type === meal)
    .map((item) => {
      const food = foods.byId(item.food_id)!;
      const k = item.grams / 100;
      return {
        item,
        food,
        calories: food.calories_per_100g * k,
        protein: food.protein_per_100g * k,
        carbs: food.carbs_per_100g * k,
        fat: food.fat_per_100g * k,
      };
    });
}

/** 某天全部条目 */
export function getAllDayEntries(date: string): FoodLogEntry[] {
  const uid = getCurrentUserId();
  const log = uid ? dailyLogs.all().find((l) => l.user_id === uid && l.date === date) : undefined;
  if (!log) return [];
  return foodItems
    .all()
    .filter((i) => i.log_id === log.id)
    .map((item) => {
      const food = foods.byId(item.food_id)!;
      const k = item.grams / 100;
      return {
        item,
        food,
        calories: food.calories_per_100g * k,
        protein: food.protein_per_100g * k,
        carbs: food.carbs_per_100g * k,
        fat: food.fat_per_100g * k,
      };
    });
}

export function addFoodItem(date: string, meal: MealType, foodId: string, grams: number): FoodLogItem {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const log = getOrCreateLog(uid, date);
  const item: FoodLogItem = {
    id: genId("item"),
    log_id: log.id,
    user_id: uid,
    food_id: foodId,
    meal_type: meal,
    grams,
    created_at: nowISO(),
  };
  foodItems.insert(item);
  void pushRow("food_log_items", item);
  return item;
}

export function removeFoodItem(itemId: string): void {
  foodItems.remove(itemId);
  void deleteRow("food_log_items", itemId);
}

/** 是否有某天记录 */
export function hasFoodLogOn(date: string): boolean {
  const uid = getCurrentUserId();
  if (!uid) return false;
  return foodItems.all().some((i) => {
    const log = dailyLogs.byId(i.log_id);
    return log?.user_id === uid && log.date === date;
  });
}

/* ============ 健身动作 exercises ============ */
const exercises = tableOps<Exercise>("exercises");

export function getExercises(): Exercise[] {
  return exercises.all();
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.byId(id);
}

export function searchExercises(query: string, category?: string): Exercise[] {
  const q = query.trim().toLowerCase();
  return exercises.all().filter((e) => {
    const matchCat = !category || e.category === category;
    const matchQ =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.primary_muscle.toLowerCase().includes(q);
    return matchCat && matchQ;
  });
}

/* ============ 训练计划 workout_plans ============ */
const plans = tableOps<WorkoutPlan>("workout_plans");
const planExercises = tableOps<WorkoutPlanExercise>("workout_plan_exercises");

export function getPlans(): WorkoutPlan[] {
  const uid = getCurrentUserId();
  return plans.all().filter((p) => p.user_id === null || p.user_id === uid);
}

export function getPlanById(id: string): WorkoutPlan | undefined {
  return plans.byId(id);
}

export function getPlanExercises(planId: string): WorkoutPlanExercise[] {
  return planExercises
    .all()
    .filter((pe) => pe.plan_id === planId)
    .sort((a, b) => a.day - b.day || a.sort_order - b.sort_order);
}

export function savePlanWithExercises(
  plan: Omit<WorkoutPlan, "id" | "user_id" | "is_custom" | "created_at">,
  items: Omit<WorkoutPlanExercise, "id" | "plan_id">[],
): WorkoutPlan {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const now = nowISO();
  const p: WorkoutPlan = { ...plan, id: genId("plan"), user_id: uid, is_custom: true, created_at: now };
  plans.insert(p);
  planExercises.insertMany(
    items.map((it) => ({ ...it, id: genId("pix"), plan_id: p.id })),
  );
  void pushRow("workout_plans", p);
  getPlanExercises(p.id).forEach((pe) => void pushRow("workout_plan_exercises", pe));
  return p;
}

/**
 * 将系统模板计划复制为「我的计划」
 * 返回新计划；若已复制过（同名计划存在）则返回已有计划。
 */
export function copyPlanAsMine(templateId: string): WorkoutPlan {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const template = plans.byId(templateId);
  if (!template) throw new Error("计划不存在");

  const existing = plans.all().find((p) => p.user_id === uid && p.name === template.name);
  if (existing) return existing;

  const now = nowISO();
  const mine: WorkoutPlan = {
    ...template,
    id: genId("plan"),
    user_id: uid,
    is_custom: true,
    created_at: now,
  };
  plans.insert(mine);
  const items = getPlanExercises(template.id);
  planExercises.insertMany(
    items.map((it) => ({ ...it, id: genId("pix"), plan_id: mine.id })),
  );
  void pushRow("workout_plans", mine);
  getPlanExercises(mine.id).forEach((pe) => void pushRow("workout_plan_exercises", pe));
  return mine;
}

/* ============ 训练记录 workout_sessions + workout_sets ============ */
const sessions = tableOps<WorkoutSession>("workout_sessions");
const sets = tableOps<WorkoutSet>("workout_sets");

export interface SaveSessionInput {
  title: string;
  body_parts: string;
  duration_min: number | null;
  notes: string | null;
  setRows: Omit<WorkoutSet, "id" | "session_id" | "user_id" | "created_at">[];
}

export function saveWorkoutSession(input: SaveSessionInput): WorkoutSession {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const now = nowISO();
  const session: WorkoutSession = {
    id: genId("sess"),
    user_id: uid,
    date: todayStr(),
    title: input.title,
    body_parts: input.body_parts,
    duration_min: input.duration_min,
    notes: input.notes,
    started_at: now,
    ended_at: now,
    created_at: now,
  };
  sessions.insert(session);
  sets.insertMany(
    input.setRows.map((s) => ({
      ...s,
      id: genId("set"),
      session_id: session.id,
      user_id: uid,
      created_at: now,
    })),
  );
  void pushRow("workout_sessions", session);
  getSessionSets(session.id).forEach((st) => void pushRow("workout_sets", st));
  return session;
}

export function getSessions(): WorkoutSession[] {
  const uid = getCurrentUserId();
  if (!uid) return [];
  return sessions
    .byUser(uid)
    .sort((a, b) => b.date.localeCompare(a.date) || b.started_at.localeCompare(a.started_at));
}

export function getSessionById(id: string): WorkoutSession | undefined {
  return sessions.byId(id);
}

export function getSessionSets(sessionId: string): WorkoutSet[] {
  return sets.all().filter((s) => s.session_id === sessionId).sort((a, b) => a.set_number - b.set_number);
}

/** 某动作最近一次训练记录（用于显示上次数据） */
export function getLastExerciseLogs(userId: string, exerciseId: string): WorkoutSet[] | null {
  const mySessions = sessions.byUser(userId).sort((a, b) => b.date.localeCompare(a.date));
  for (const s of mySessions) {
    const rows = sets.all().filter((x) => x.session_id === s.id && x.exercise_id === exerciseId);
    if (rows.length > 0) return rows.sort((a, b) => a.set_number - b.set_number);
  }
  return null;
}

/** 某动作历史（跨会话，按时间升序），用于力量变化分析 */
export function getExerciseHistory(userId: string, exerciseId: string): { date: string; bestWeight: number; bestVolume: number }[] {
  const mySessions = sessions.byUser(userId).sort((a, b) => a.date.localeCompare(b.date));
  const out: { date: string; bestWeight: number; bestVolume: number }[] = [];
  for (const s of mySessions) {
    const rows = sets.all().filter((x) => x.session_id === s.id && x.exercise_id === exerciseId);
    if (rows.length === 0) continue;
    const bestWeight = Math.max(...rows.map((r) => r.weight_kg));
    const bestVolume = rows.reduce((sum, r) => sum + r.weight_kg * r.reps, 0);
    out.push({ date: s.date, bestWeight, bestVolume });
  }
  return out;
}

/** 训练统计（总次数、总组数） */
export function getTrainingStats(): { count: number; totalSets: number; totalVolume: number } {
  const uid = getCurrentUserId();
  if (!uid) return { count: 0, totalSets: 0, totalVolume: 0 };
  const mySessions = sessions.byUser(uid);
  let totalSets = 0;
  let totalVolume = 0;
  for (const s of mySessions) {
    for (const st of sets.all().filter((x) => x.session_id === s.id)) {
      totalSets += 1;
      totalVolume += st.weight_kg * st.reps;
    }
  }
  return { count: mySessions.length, totalSets, totalVolume };
}

/* ============ 身体数据 body_records ============ */
const bodyRecords = tableOps<BodyRecord>("body_records");

export function getBodyRecords(): BodyRecord[] {
  const uid = getCurrentUserId();
  if (!uid) return [];
  return bodyRecords.byUser(uid).sort((a, b) => a.date.localeCompare(b.date));
}

export function getBodyRecordById(id: string): BodyRecord | undefined {
  return bodyRecords.byId(id);
}

export function getLatestBodyRecord(): BodyRecord | null {
  const recs = getBodyRecords();
  return recs.length > 0 ? recs[recs.length - 1] : null;
}

export function saveBodyRecord(data: Omit<BodyRecord, "id" | "user_id" | "created_at">): BodyRecord {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  // 同一天存在则更新
  const existing = bodyRecords.byUser(uid).find((r) => r.date === data.date);
  if (existing) {
    const updated = bodyRecords.update(existing.id, { ...data })!;
    void pushRow("body_records", updated);
    return updated;
  }
  const rec: BodyRecord = { ...data, id: genId("body"), user_id: uid, created_at: nowISO() };
  bodyRecords.insert(rec);
  void pushRow("body_records", rec);
  return rec;
}

export function deleteBodyRecord(id: string): void {
  bodyRecords.remove(id);
  void deleteRow("body_records", id);
}

/* ============ 每日热量 daily_calories ============ */
const dailyCalories = tableOps<DailyCalories>("daily_calories");

export function getDailyCalories(date: string): DailyCalories | null {
  const uid = getCurrentUserId();
  if (!uid) return null;
  return dailyCalories.byUser(uid).find((d) => d.date === date) ?? null;
}

export function saveDailyCalories(
  date: string,
  data: { strength_min: number; cardio_min: number; exercise_burn_est: number },
): DailyCalories {
  const uid = getCurrentUserId();
  if (!uid) throw new Error("未登录");
  const existing = dailyCalories.byUser(uid).find((d) => d.date === date);
  if (existing) {
    const updated = dailyCalories.update(existing.id, { ...data, updated_at: nowISO() })!;
    void pushRow("daily_calories", updated);
    return updated;
  }
  const rec: DailyCalories = {
    id: genId("dc"),
    user_id: uid,
    date,
    ...data,
    created_at: nowISO(),
    updated_at: nowISO(),
  };
  dailyCalories.insert(rec);
  void pushRow("daily_calories", rec);
  return rec;
}
