/**
 * 验证热门博主计划模板的动作匹配率（临时脚本）
 * 运行：npx tsx scripts/verify-popular-plans.ts
 */
import { buildPopularPlans } from "../src/lib/seed/popularPlans";
import { buildExerciseSeed } from "../src/lib/seed/exercises";

const store = new Map<string, string>();
(globalThis as any).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
  },
};

const exSeed = buildExerciseSeed();
store.set("fittrack:exercises", JSON.stringify(exSeed));

const plans = buildPopularPlans();
const exById = new Map(exSeed.map((e) => [e.id, e.name]));
let totalPlans = 0;
let totalEx = 0;
let totalMissing = 0;

for (const p of plans) {
  const days = new Set(p.exercises.map((e) => e.day)).size;
  const missing = p.exercises.filter((e) => !exById.has(e.exercise_id));
  totalPlans++;
  totalEx += p.exercises.length;
  totalMissing += missing.length;
  console.log(
    `${p.plan.name} | ${days}天 | ${p.exercises.length}个动作 | 未匹配: ${missing.length === 0 ? "无" : missing.map((m) => m.exercise_id).join(",")}`,
  );
}
console.log(`\n共 ${totalPlans} 个热门计划 / ${totalEx} 个动作 / 未匹配 ${totalMissing}`);
if (totalMissing > 0) process.exit(1);
console.log("全部动作匹配成功");
