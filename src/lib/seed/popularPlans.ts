import type { Exercise, WorkoutPlan, WorkoutPlanExercise } from "@/types";
import { genId, nowISO, readTable } from "@/lib/db/localStorage";

/**
 * 网络热门博主训练计划（系统内置模板）
 * 来源整理：谭成义（三分化推拉腿 / 新手四分化 / 居家哑铃四分化）、橙子（胸部强化周期）
 * 动作按名称从动作库匹配，匹配失败的动作会跳过并记录。
 */

interface PopularEx {
  name: string;
  sets: number;
  reps: string;
  rir?: string;
  rest?: number;
}

interface PopularDay {
  bodyPart: string;
  exercises: PopularEx[];
}

export interface PopularPlanDef {
  author: string;
  name: string;
  desc: string;
  daysPerWeek: number;
  days: PopularDay[];
}

export const POPULAR_PLANS: PopularPlanDef[] = [
  {
    author: "谭成义",
    name: "谭成义·三分化推拉腿",
    desc: "推-拉-腿三天循环，同发力肌群集中训练，恢复充足。推荐练3休1，效率拉满。",
    daysPerWeek: 3,
    days: [
      {
        bodyPart: "推日（胸 + 肩中束 + 三头）",
        exercises: [
          { name: "杠铃卧推", sets: 4, reps: "8-12", rir: "1-2", rest: 120 },
          { name: "上斜哑铃卧推", sets: 4, reps: "10-12", rir: "1-2", rest: 120 },
          { name: "双杠臂屈伸", sets: 3, reps: "8-12", rir: "1-2", rest: 90 },
          { name: "哑铃侧平举", sets: 4, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "绳索下压", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
        ],
      },
      {
        bodyPart: "拉日（背 + 二头）",
        exercises: [
          { name: "高位下拉", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "杠铃划船", sets: 4, reps: "8-12", rir: "1-2", rest: 120 },
          { name: "坐姿划船", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "杠铃弯举", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "哑铃交替弯举", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "腿日（腿 + 臀 + 肩后束）",
        exercises: [
          { name: "杠铃深蹲", sets: 4, reps: "8-10", rir: "1-2", rest: 150 },
          { name: "罗马尼亚硬拉", sets: 3, reps: "8-10", rir: "1-2", rest: 120 },
          { name: "腿弯举", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "箭步蹲", sets: 3, reps: "10-12/腿", rir: "1-3", rest: 90 },
          { name: "面拉", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
        ],
      },
    ],
  },
  {
    author: "谭成义",
    name: "谭成义·新手四分化",
    desc: "专为小白设计，一周4练全身覆盖：胸三头 / 背二头 / 肩手臂 / 臀腿腹，每组 4×12，重量循序渐进。",
    daysPerWeek: 4,
    days: [
      {
        bodyPart: "胸 + 三头",
        exercises: [
          { name: "坐姿器械推胸", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "双杠臂屈伸", sets: 4, reps: "8-12", rir: "1-2", rest: 90 },
          { name: "上斜哑铃卧推", sets: 4, reps: "10-12", rir: "1-2", rest: 120 },
          { name: "杠铃推举", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "绳索下压", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
        ],
      },
      {
        bodyPart: "背 + 二头",
        exercises: [
          { name: "高位下拉", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "坐姿划船", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "哑铃单臂划船", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "杠铃弯举", sets: 4, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "哑铃交替弯举", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "肩 + 手臂",
        exercises: [
          { name: "哑铃推举", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "哑铃侧平举", sets: 4, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "杠铃弯举", sets: 4, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "绳索下压", sets: 4, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "面拉", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
        ],
      },
      {
        bodyPart: "臀腿 + 腹部",
        exercises: [
          { name: "杠铃深蹲", sets: 4, reps: "10-12", rir: "1-2", rest: 150 },
          { name: "箭步蹲", sets: 3, reps: "10-12/腿", rir: "1-3", rest: 90 },
          { name: "罗马尼亚硬拉", sets: 3, reps: "10-12", rir: "1-2", rest: 120 },
          { name: "杠铃臀桥", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "悬垂举腿", sets: 3, reps: "8-12", rir: "1-3", rest: 90 },
          { name: "平板支撑", sets: 3, reps: "30-60秒", rir: "1-3", rest: 60 },
        ],
      },
    ],
  },
  {
    author: "谭成义",
    name: "谭成义·居家哑铃四分化",
    desc: "无需去健身房，一副哑铃搞定：胸三头 / 背二头 / 下肢臀 / 肩手臂腹，4天循环。",
    daysPerWeek: 4,
    days: [
      {
        bodyPart: "胸 + 三头（居家）",
        exercises: [
          { name: "俯卧撑", sets: 4, reps: "10-15", rir: "1-3", rest: 60 },
          { name: "哑铃卧推", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "上斜哑铃卧推", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "哑铃飞鸟", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "哑铃颈后臂屈伸", sets: 3, reps: "10-12", rir: "1-3", rest: 60 },
        ],
      },
      {
        bodyPart: "背 + 二头（居家）",
        exercises: [
          { name: "引体向上", sets: 3, reps: "6-10", rir: "1-3", rest: 120 },
          { name: "哑铃单臂划船", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "坐姿划船", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "哑铃交替弯举", sets: 4, reps: "10-12", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "下肢 + 臀（居家）",
        exercises: [
          { name: "杠铃臀桥", sets: 3, reps: "12-15", rir: "1-3", rest: 90 },
          { name: "箭步蹲", sets: 4, reps: "10-12/腿", rir: "1-2", rest: 90 },
          { name: "哑铃罗马尼亚硬拉", sets: 3, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "保加利亚分腿蹲", sets: 3, reps: "10-12/腿", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "肩 + 手臂 + 腹（居家）",
        exercises: [
          { name: "哑铃推举", sets: 4, reps: "10-12", rir: "1-2", rest: 90 },
          { name: "哑铃侧平举", sets: 4, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "哑铃颈后臂屈伸", sets: 3, reps: "10-12", rir: "1-3", rest: 60 },
          { name: "卷腹", sets: 3, reps: "15-20", rir: "1-3", rest: 60 },
          { name: "平板支撑", sets: 3, reps: "30-60秒", rir: "1-3", rest: 60 },
        ],
      },
    ],
  },
  {
    author: "橙子",
    name: "橙子·胸部强化周期",
    desc: "keepgoing 橙子计划：练3休1，卧推系列为主，8-10RM 增力增围，专攻胸部。",
    daysPerWeek: 3,
    days: [
      {
        bodyPart: "胸部 · 平板为主",
        exercises: [
          { name: "杠铃卧推", sets: 4, reps: "6-8", rir: "0-2", rest: 150 },
          { name: "上斜哑铃卧推", sets: 4, reps: "8-10", rir: "1-2", rest: 120 },
          { name: "蝴蝶机夹胸", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "双杠臂屈伸", sets: 3, reps: "8-10", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "胸部 · 上斜为主",
        exercises: [
          { name: "上斜哑铃卧推", sets: 4, reps: "8-10", rir: "1-2", rest: 120 },
          { name: "哑铃卧推", sets: 4, reps: "8-10", rir: "1-2", rest: 120 },
          { name: "哑铃飞鸟", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "坐姿器械推胸", sets: 3, reps: "10-12", rir: "1-3", rest: 90 },
        ],
      },
      {
        bodyPart: "胸部 · 泵感收尾",
        exercises: [
          { name: "坐姿器械推胸", sets: 4, reps: "10-12", rir: "1-3", rest: 90 },
          { name: "杠铃卧推", sets: 3, reps: "8-10", rir: "1-2", rest: 120 },
          { name: "蝴蝶机夹胸", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
          { name: "绳索下压", sets: 3, reps: "12-15", rir: "1-3", rest: 60 },
        ],
      },
    ],
  },
];

/**
 * 生成热门计划模板（系统级，user_id=null）
 * 返回 { plan, exercises }，动作按名称匹配动作库，未匹配的跳过。
 */
export function buildPopularPlans(): { plan: WorkoutPlan; exercises: WorkoutPlanExercise[] }[] {
  const now = nowISO();
  const exByName = new Map(readTable<Exercise>("exercises").map((e) => [e.name, e.id]));
  const out: { plan: WorkoutPlan; exercises: WorkoutPlanExercise[] }[] = [];

  for (const def of POPULAR_PLANS) {
    const plan: WorkoutPlan = {
      id: genId("plan"),
      user_id: null,
      name: def.name,
      level: "intermediate",
      goal: "muscle_gain",
      days_per_week: def.daysPerWeek,
      description: def.desc,
      is_custom: false,
      created_at: now,
    };
    const exercises: WorkoutPlanExercise[] = [];
    def.days.forEach((d, di) => {
      d.exercises.forEach((ex, ei) => {
        const exId = exByName.get(ex.name);
        if (!exId) return;
        exercises.push({
          id: genId("pix"),
          plan_id: plan.id,
          day: di + 1,
          body_part: d.bodyPart,
          exercise_id: exId,
          sets: ex.sets,
          reps: ex.reps,
          rir: ex.rir ?? "1-3",
          rest_sec: ex.rest ?? 90,
          sort_order: ei,
        });
      });
    });
    out.push({ plan, exercises });
  }
  return out;
}
