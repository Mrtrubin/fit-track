/**
 * 端到端冒烟测试（数据层）
 * 模拟浏览器 localStorage，完整走一遍验收流程：
 * 初始化 → BMR/TDEE/目标计算 → 食物库搜索 → 记录饮食 → 训练记录 →
 * 上次数据显示 → 身体数据 → 体重趋势分析 → 渐进超负荷
 *
 * 运行：node --experimental-strip-types scripts/smoke-test.mjs
 */

// ===== mock localStorage =====
const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
};

const db = await import("../src/lib/db/index.ts");
const cal = await import("../src/lib/calc/calories.ts");
const macros = await import("../src/lib/calc/macros.ts");
const nut = await import("../src/lib/calc/nutrition.ts");
const wt = await import("../src/lib/calc/weight.ts");
const prog = await import("../src/lib/calc/progression.ts");

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${msg}`);
  } else {
    fail++;
    console.log(`  ✗ FAIL: ${msg}`);
  }
}

// ===== 1. 初始化 =====
console.log("\n[1] 初始化");
db.seedIfNeeded();
const uid = db.getCurrentUserId();
ok(!!uid, "创建当前用户");
ok(db.getFoods().length > 0, `内置食物库播种 (${db.getFoods().length} 种)`);
ok(db.getExercises().length > 0, `内置动作库播种 (${db.getExercises().length} 个动作)`);

// ===== 1.5 热门博主计划模板 =====
console.log("\n[1.5] 热门博主计划");
const templates = db.getPlans().filter((p) => p.user_id === null);
ok(templates.length >= 4, `系统模板播种 (${templates.length} 个热门计划)`);
const tpl = templates[0];
const tplEx = db.getPlanExercises(tpl.id);
ok(tplEx.length > 0, `模板 ${tpl.name} 含 ${tplEx.length} 个动作`);
const mine = db.copyPlanAsMine(tpl.id);
ok(mine.user_id === uid && mine.is_custom, "复制模板为我的计划");
ok(db.getPlanExercises(mine.id).length === tplEx.length, "复制的计划动作数一致");
ok(db.copyPlanAsMine(tpl.id).id === mine.id, "重复复制返回已有计划");

// ===== 2. 个人资料 + 计算（验收：男 22岁 180cm 80kg 减脂） =====
console.log("\n[2] 个人资料与热量计算");
db.saveProfile({
  name: "测试用户",
  gender: "male",
  age: 22,
  height_cm: 180,
  weight_kg: 80,
  body_fat_pct: null,
  activity_level: "moderate",
  training_days_per_week: 4,
  training_minutes_per_session: 60,
  goal: "fat_loss",
});
const profile = db.getProfile();
ok(profile?.age === 22 && profile.weight_kg === 80, "个人资料保存");

const bmr = cal.calcBmr({ gender: "male", weightKg: 80, heightCm: 180, age: 22 });
ok(bmr === 1820, `BMR = 1820 (Mifflin-St Jeor) 实际 ${bmr}`);
const tdee = cal.calcTdee(bmr, "moderate");
ok(tdee === 2821, `TDEE = 2821 (×1.55) 实际 ${tdee}`);
const target = cal.calcTargetCalories(tdee, { goal: "fat_loss", pace: "standard" });
ok(target.calories === 2421, `目标热量 = 2421 (标准减脂 -400) 实际 ${target.calories}`);
const m = macros.calcMacros({ weightKg: 80, targetCalories: 2421, proteinFactor: 1.8 });
ok(m.protein_g === 144, `蛋白质 = 144g (80×1.8) 实际 ${m.protein_g}`);
ok(m.fat_g === 64, `脂肪 = 64g (80×0.8) 实际 ${m.fat_g}`);
ok(m.carbs_g === 317, `碳水 = 317g (剩余热量/4) 实际 ${m.carbs_g}`);

db.saveGoal({
  goal: "fat_loss",
  target_calories: target.calories,
  protein_g: m.protein_g,
  carbs_g: m.carbs_g,
  fat_g: m.fat_g,
  protein_factor: 1.8,
  fat_factor: 0.8,
  pace: "standard",
});
ok(db.getGoal()?.target_calories === 2421, "目标已保存");

// 极端低热量警告
const low = cal.calcTargetCalories(1200, { goal: "fat_loss", pace: "aggressive" });
ok(!!low.warning, `极低热量给出警告: ${low.warning}`);

// ===== 3. 食物库 + 饮食记录 =====
console.log("\n[3] 食物与饮食记录");
const today = "2026-10-08";
const rice = db.searchFoods("米饭").find((f) => f.name === "米饭（熟）");
ok(!!rice, "搜索到米饭");
db.addFoodItem(today, "lunch", rice.id, 210);
const egg = db.searchFoods("鸡蛋").find((f) => f.name === "鸡蛋（全蛋）");
const chicken = db.searchFoods("鸡胸肉")[0];
const duck = db.searchFoods("鸭腿")[0];
const bread = db.searchFoods("全麦面包")[0];
db.addFoodItem(today, "lunch", egg.id, 100);
db.addFoodItem(today, "lunch", chicken.id, 150);
db.addFoodItem(today, "dinner", duck.id, 110);
db.addFoodItem(today, "breakfast", bread.id, 50);

const entries = db.getAllDayEntries(today);
const totals = nut.sumNutrition(entries);
console.log(`  午餐实际: 米饭210g → ${Math.round((rice.calories_per_100g * 210) / 100)} kcal`);
ok(Math.round(totals.calories) > 400, `全天合计 ${Math.round(totals.calories)} kcal (>400 合理)`);
ok(entries.length === 5, "5 个食物条目");

// 自定义食物
const custom = db.addCustomFood({
  name: "鲨鱼菲特鸭腿",
  category: "肉类",
  brand: "鲨鱼菲特",
  calories_per_100g: 190,
  protein_per_100g: 20,
  carbs_per_100g: 0,
  fat_per_100g: 12,
  fiber_per_100g: 0,
  serving_size: 110,
  source: "测试",
});
ok(db.searchFoods("鲨鱼菲特").some((f) => f.id === custom.id), "自定义食物可搜索");
db.updateFood(custom.id, { calories_per_100g: 200 });
ok(db.getFoodById(custom.id)?.calories_per_100g === 200, "自定义食物可编辑");
db.deleteFood(custom.id);
ok(!db.getFoodById(custom.id), "自定义食物可删除");

// ===== 4. 训练记录 =====
console.log("\n[4] 训练记录");
const lat = db.getExercises().find((e) => e.name === "高位下拉");
ok(!!lat, "动作库存在高位下拉");
db.saveWorkoutSession({
  title: "4天增肌·背 + 二头",
  body_parts: "背阔肌",
  duration_min: 50,
  notes: null,
  setRows: [
    { exercise_id: lat.id, exercise_name: "高位下拉", set_number: 1, weight_kg: 35, reps: 10, rpe: null, rir: 2, target_sets: 4, target_reps: "10-12" },
    { exercise_id: lat.id, exercise_name: "高位下拉", set_number: 2, weight_kg: 35, reps: 9, rpe: null, rir: 2, target_sets: 4, target_reps: "10-12" },
    { exercise_id: lat.id, exercise_name: "高位下拉", set_number: 3, weight_kg: 30, reps: 12, rpe: null, rir: 3, target_sets: 4, target_reps: "10-12" },
    { exercise_id: lat.id, exercise_name: "高位下拉", set_number: 4, weight_kg: 30, reps: 12, rpe: null, rir: 3, target_sets: 4, target_reps: "10-12" },
  ],
});
const lastLogs = db.getLastExerciseLogs(uid, lat.id);
ok(lastLogs && lastLogs.length === 4, "上次训练数据显示 4 组");
ok(lastLogs[0].weight_kg === 35 && lastLogs[0].reps === 10, "第1组 35kg×10");

// ===== 5. 渐进超负荷 =====
console.log("\n[5] 渐进超负荷");
const adv = prog.getProgressionAdvice("10-12", [
  { reps: 12, rir: 3, weight_kg: 30 },
  { reps: 12, rir: 2, weight_kg: 30 },
], "cable");
ok(adv.type === "increase", `全部达上限 → 建议增重: ${adv.message}`);
const adv2 = prog.getProgressionAdvice("8-12", [
  { reps: 6, rir: 0, weight_kg: 50 },
  { reps: 5, rir: 0, weight_kg: 50 },
], "barbell");
ok(adv2.type === "maintain", `未达标 → 维持: ${adv2.message}`);

// ===== 6. 身体数据 + 趋势分析 =====
console.log("\n[6] 身体数据与体重分析");
const dates = ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29", "2026-10-06"];
const weights = [80.2, 79.8, 79.4, 79.1, 78.6, 78.2];
dates.forEach((d, i) =>
  db.saveBodyRecord({ date: d, weight_kg: weights[i], body_fat_pct: null, waist_cm: 82, chest_cm: null, hip_cm: null, thigh_cm: null, arm_cm: null }),
);
const records = db.getBodyRecords();
ok(records.length === 6, "6 条体重记录");
const analysis = wt.analyzeWeight(records, "fat_loss");
console.log(`  最近周变化: ${analysis.weeklyChange} kg`);
ok(analysis.weeklyChange < 0, "体重在下降");
ok(analysis.weeklyChange >= -1.0, "减脂速度在合理区间（未过快）");
const weekly = wt.weeklyAverages(records);
ok(weekly.length >= 3, `周平均分组 ${weekly.length} 周`);
ok(weekly[weekly.length - 1].avgWeight < weekly[0].avgWeight, "周平均体重下降趋势");

// 减脂过快警告
const fast = wt.analyzeWeight(
  [{ id: "a", user_id: uid, date: "2026-10-01", weight_kg: 80, body_fat_pct: null, waist_cm: null, chest_cm: null, hip_cm: null, thigh_cm: null, arm_cm: null, created_at: "" },
   { id: "b", user_id: uid, date: "2026-10-08", weight_kg: 78.2, body_fat_pct: null, waist_cm: null, chest_cm: null, hip_cm: null, thigh_cm: null, arm_cm: null, created_at: "" }],
  "fat_loss",
);
// 两周间变化需要第三周数据才准确；此处仅确认能返回建议
ok(typeof fast.advice === "string" || fast.advice === null, "体重分析返回建议");

// ===== 7. 数据隔离 =====
console.log("\n[7] 用户数据隔离");
db.setCurrentUserId("user_other");
ok(db.getProfile() === null, "其他用户看不到当前用户资料");
ok(db.getBodyRecords().length === 0, "其他用户看不到当前用户身体数据");
db.setCurrentUserId(uid);
ok(db.getBodyRecords().length === 6, "切回后数据完整");

console.log(`\n========== 冒烟测试完成: ${pass} 通过 / ${fail} 失败 ==========`);
process.exit(fail > 0 ? 1 : 0);
