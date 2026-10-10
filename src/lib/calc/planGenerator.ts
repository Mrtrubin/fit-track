import type { Exercise, MuscleCategory, TrainingLevel } from "@/types";
import { getExercises } from "@/lib/db";

/**
 * 训练计划生成器
 * 根据 训练水平 + 目标 + 每周天数 生成结构化计划。
 * 动作从动作库按部位挑选，组数/次数/休息随水平与目标调整。
 */

export type PlanGoal = "fat_loss" | "muscle_gain" | "maintain" | "strength";

export const PLAN_GOAL_LABELS: Record<PlanGoal, string> = {
  fat_loss: "减脂",
  muscle_gain: "增肌",
  maintain: "维持",
  strength: "力量",
};

export interface GeneratedDayExercise {
  exercise_id: string;
  sets: number;
  reps: string;
  rir: string;
  rest_sec: number;
}

export interface GeneratedDay {
  day: number;
  body_part: string;
  exercises: GeneratedDayExercise[];
}

export interface GeneratedPlan {
  name: string;
  description: string;
  days: GeneratedDay[];
}

/** 从动作库按部位挑选动作 */
function pickExercises(category: MuscleCategory, count: number, excludeIds: Set<string> = new Set()): Exercise[] {
  const pool = getExercises().filter((e) => e.category === category && !excludeIds.has(e.id));
  return pool.slice(0, count);
}

function pickByNames(category: MuscleCategory, preferred: string[], count: number, excludeIds: Set<string> = new Set()): Exercise[] {
  const all = getExercises().filter((e) => e.category === category && !excludeIds.has(e.id));
  const picked: Exercise[] = [];
  for (const name of preferred) {
    const hit = all.find((e) => e.name === name);
    if (hit) picked.push(hit);
  }
  // 补足剩余
  for (const e of all) {
    if (picked.length >= count) break;
    if (!picked.includes(e)) picked.push(e);
  }
  return picked.slice(0, count);
}

interface LoadParams {
  sets: number;
  reps: string;
  rir: string;
  rest_sec: number;
}

function loadFor(level: TrainingLevel, goal: PlanGoal): LoadParams {
  const sets = level === "beginner" ? 3 : level === "intermediate" ? 4 : 4;
  switch (goal) {
    case "strength":
      return { sets, reps: "5-6", rir: "0-2", rest_sec: 180 };
    case "fat_loss":
      return { sets, reps: "10-15", rir: "1-3", rest_sec: 60 };
    case "maintain":
      return { sets, reps: "8-12", rir: "1-3", rest_sec: 90 };
    case "muscle_gain":
    default:
      return { sets, reps: "8-12", rir: "1-3", rest_sec: 120 };
  }
}

/** 按天生成动作列表 */
function buildDayExercises(
  parts: { category: MuscleCategory; count: number; preferred?: string[] }[],
  load: LoadParams,
  used: Set<string>,
): GeneratedDayExercise[] {
  const out: GeneratedDayExercise[] = [];
  for (const p of parts) {
    const exs = p.preferred
      ? pickByNames(p.category, p.preferred, p.count, used)
      : pickExercises(p.category, p.count, used);
    for (const ex of exs) {
      used.add(ex.id);
      out.push({
        exercise_id: ex.id,
        sets: load.sets,
        reps: load.reps,
        rir: load.rir,
        rest_sec: load.rest_sec,
      });
    }
  }
  return out;
}

export function generatePlan(level: TrainingLevel, goal: PlanGoal, daysPerWeek: number): GeneratedPlan {
  const load = loadFor(level, goal);
  const used = new Set<string>();
  const days: GeneratedDay[] = [];

  /** 常用动作优先 */
  const CHEST = ["杠铃卧推", "上斜哑铃卧推", "哑铃卧推"];
  const BACK = ["高位下拉", "杠铃划船", "坐姿划船"];
  const SHOULDER = ["哑铃推举", "哑铃侧平举", "面拉"];
  const LEG = ["杠铃深蹲", "腿举", "罗马尼亚硬拉", "箭步蹲"];
  const GLUTE = ["杠铃臀桥", "髋外展"];
  const BICEP = ["杠铃弯举", "哑铃交替弯举"];
  const TRICEP = ["绳索下压", "窄距卧推"];
  const ABS = ["卷腹", "平板支撑"];
  const CARDIO = ["跑步机（匀速）", "椭圆机"];

  const PUSH = { category: "chest" as MuscleCategory, count: 2, preferred: CHEST };
  const PULL = { category: "back" as MuscleCategory, count: 2, preferred: BACK };

  if (daysPerWeek === 3) {
    // 全身 ×3
    days.push({
      day: 1, body_part: "全身 A",
      exercises: buildDayExercises(
        [
          { category: "legs", count: 2, preferred: LEG.slice(0, 2) },
          { category: "chest", count: 2, preferred: CHEST.slice(0, 2) },
          { category: "back", count: 2, preferred: BACK.slice(0, 2) },
          { category: "abs", count: 1, preferred: ABS.slice(0, 1) },
        ],
        load, used,
      ),
    });
    days.push({
      day: 2, body_part: "全身 B",
      exercises: buildDayExercises(
        [
          { category: "legs", count: 2, preferred: LEG.slice(2, 4) },
          { category: "chest", count: 2, preferred: CHEST.slice(2, 3) },
          { category: "back", count: 2, preferred: BACK.slice(2, 3) },
          { category: "shoulders", count: 2, preferred: SHOULDER },
        ],
        load, used,
      ),
    });
    days.push({
      day: 3, body_part: "全身 C",
      exercises: buildDayExercises(
        [
          { category: "legs", count: 2, preferred: LEG.slice(1, 3) },
          { category: "chest", count: 1 },
          { category: "back", count: 1 },
          { category: "biceps", count: 1, preferred: BICEP },
          { category: "triceps", count: 1, preferred: TRICEP },
          { category: "abs", count: 1, preferred: ABS },
        ],
        load, used,
      ),
    });
  } else if (daysPerWeek === 4) {
    days.push({
      day: 1, body_part: "胸 + 三头",
      exercises: buildDayExercises(
        [
          { category: "chest", count: 3, preferred: CHEST },
          { category: "triceps", count: 2, preferred: TRICEP },
        ],
        load, used,
      ),
    });
    days.push({
      day: 2, body_part: "背 + 二头",
      exercises: buildDayExercises(
        [
          { category: "back", count: 3, preferred: BACK },
          { category: "biceps", count: 2, preferred: BICEP },
        ],
        load, used,
      ),
    });
    days.push({
      day: 3, body_part: "休息 / 主动恢复",
      exercises: [],
    });
    days.push({
      day: 4, body_part: "肩 + 腹",
      exercises: buildDayExercises(
        [
          { category: "shoulders", count: 3, preferred: SHOULDER },
          { category: "abs", count: 2, preferred: ABS },
        ],
        load, used,
      ),
    });
    days.push({
      day: 5, body_part: "腿",
      exercises: buildDayExercises(
        [
          { category: "legs", count: 3, preferred: LEG },
          { category: "glutes", count: 1, preferred: GLUTE },
        ],
        load, used,
      ),
    });
  } else if (daysPerWeek === 5) {
    days.push({
      day: 1, body_part: "胸 + 三头",
      exercises: buildDayExercises(
        [
          { category: "chest", count: 3, preferred: CHEST },
          { category: "triceps", count: 2, preferred: TRICEP },
        ],
        load, used,
      ),
    });
    days.push({
      day: 2, body_part: "背 + 二头",
      exercises: buildDayExercises(
        [
          { category: "back", count: 3, preferred: BACK },
          { category: "biceps", count: 2, preferred: BICEP },
        ],
        load, used,
      ),
    });
    days.push({
      day: 3, body_part: "腿 + 臀",
      exercises: buildDayExercises(
        [
          { category: "legs", count: 3, preferred: LEG },
          { category: "glutes", count: 2, preferred: GLUTE },
        ],
        load, used,
      ),
    });
    days.push({
      day: 4, body_part: "肩 + 腹",
      exercises: buildDayExercises(
        [
          { category: "shoulders", count: 3, preferred: SHOULDER },
          { category: "abs", count: 2, preferred: ABS },
        ],
        load, used,
      ),
    });
    days.push({
      day: 5, body_part: "手臂 + 核心",
      exercises: buildDayExercises(
        [
          { category: "biceps", count: 2, preferred: BICEP },
          { category: "triceps", count: 2, preferred: TRICEP },
          { category: "abs", count: 2, preferred: ABS },
        ],
        load, used,
      ),
    });
  } else {
    // 6天：推 / 拉 / 腿 ×2
    for (const round of [1, 2]) {
      days.push({
        day: round === 1 ? 1 : 4,
        body_part: "推（胸 + 肩 + 三头）",
        exercises: buildDayExercises(
          [
            { category: "chest", count: 2, preferred: CHEST },
            { category: "shoulders", count: 2, preferred: SHOULDER.slice(0, 2) },
            { category: "triceps", count: 1, preferred: TRICEP.slice(0, 1) },
          ],
          load, used,
        ),
      });
      days.push({
        day: round === 1 ? 2 : 5,
        body_part: "拉（背 + 二头）",
        exercises: buildDayExercises(
          [
            { category: "back", count: 3, preferred: BACK },
            { category: "biceps", count: 2, preferred: BICEP },
          ],
          load, used,
        ),
      });
      days.push({
        day: round === 1 ? 3 : 6,
        body_part: "腿 + 臀",
        exercises: buildDayExercises(
          [
            { category: "legs", count: 3, preferred: LEG },
            { category: "glutes", count: 1, preferred: GLUTE },
            { category: "abs", count: 1, preferred: ABS.slice(0, 1) },
          ],
          load, used,
        ),
      });
    }
  }

  const goalLabel = PLAN_GOAL_LABELS[goal];
  const levelLabel = level === "beginner" ? "新手" : level === "intermediate" ? "基础" : "进阶";
  const name = `${daysPerWeek}天${goalLabel}·${levelLabel}`;
  const hasRest = days.some((d) => d.exercises.length === 0);
  const description = hasRest
    ? `${levelLabel}${goalLabel}分化训练，每周 ${daysPerWeek} 天，含主动恢复日。`
    : `${levelLabel}${goalLabel}分化训练，每周 ${daysPerWeek} 天。`;

  return { name, description, days };
}
