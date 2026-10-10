import type { Food } from "@/types";
import { genId, nowISO } from "@/lib/db/localStorage";

/**
 * 系统内置食物库种子数据
 * 营养数据为每100g参考值（来源：常见食物营养成分表，供日常记录参考）。
 * user_id = null 表示系统预置，用户不可删除；is_custom = false。
 */

interface SeedFood {
  name: string;
  category: string;
  brand?: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving?: number;
  source: string;
}

const FOODS: SeedFood[] = [
  // 主食
  { name: "米饭（熟）", category: "主食", cal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, fiber: 0.3, serving: 150, source: "中国食物成分表" },
  { name: "全麦面包", category: "主食", brand: "普通市售", cal: 246, protein: 8.5, carbs: 41, fat: 3.4, fiber: 6.5, serving: 50, source: "USDA" },
  { name: "燕麦片", category: "主食", cal: 389, protein: 16.9, carbs: 66.3, fat: 6.9, fiber: 10.6, serving: 40, source: "USDA" },
  { name: "红薯", category: "主食", cal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, fiber: 3, serving: 150, source: "中国食物成分表" },
  { name: "玉米", category: "主食", cal: 112, protein: 4, carbs: 22.8, fat: 1.2, fiber: 2.9, serving: 100, source: "USDA" },
  { name: "意大利面（煮）", category: "主食", cal: 131, protein: 5, carbs: 25, fat: 1.1, fiber: 1.8, serving: 150, source: "USDA" },
  // 肉类
  { name: "鸡胸肉", category: "肉类", cal: 133, protein: 23.3, carbs: 0, fat: 4.1, fiber: 0, serving: 150, source: "USDA" },
  { name: "鸭腿（去皮烤）", category: "肉类", brand: "鲨鱼菲特", cal: 190, protein: 20, carbs: 0, fat: 12, fiber: 0, serving: 110, source: "商品营养标签" },
  { name: "瘦牛肉", category: "肉类", cal: 250, protein: 26, carbs: 0, fat: 15, fiber: 0, serving: 150, source: "USDA" },
  { name: "猪里脊", category: "肉类", cal: 143, protein: 22.5, carbs: 0, fat: 5.5, fiber: 0, serving: 150, source: "中国食物成分表" },
  { name: "三文鱼", category: "肉类", cal: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, serving: 150, source: "USDA" },
  { name: "虾仁", category: "肉类", cal: 99, protein: 24, carbs: 0.2, fat: 0.3, fiber: 0, serving: 120, source: "USDA" },
  { name: "鸡腿肉", category: "肉类", cal: 209, protein: 26, carbs: 0, fat: 11, fiber: 0, serving: 150, source: "USDA" },
  // 蛋类
  { name: "鸡蛋（全蛋）", category: "蛋类", cal: 144, protein: 13.3, carbs: 2.8, fat: 8.8, fiber: 0, serving: 50, source: "USDA" },
  { name: "蛋白（蛋清）", category: "蛋类", cal: 52, protein: 10.9, carbs: 0.7, fat: 0.2, fiber: 0, serving: 50, source: "USDA" },
  // 奶制品
  { name: "纯牛奶", category: "奶制品", cal: 66, protein: 3.3, carbs: 5, fat: 3.6, fiber: 0, serving: 250, source: "中国食物成分表" },
  { name: "希腊酸奶（无糖）", category: "奶制品", cal: 97, protein: 9, carbs: 3.6, fat: 5, fiber: 0, serving: 150, source: "USDA" },
  { name: "低脂奶酪", category: "奶制品", cal: 165, protein: 16.5, carbs: 3, fat: 9.5, fiber: 0, serving: 50, source: "USDA" },
  // 蔬菜
  { name: "西兰花", category: "蔬菜", cal: 34, protein: 2.8, carbs: 6.6, fat: 0.4, fiber: 2.6, serving: 100, source: "USDA" },
  { name: "菠菜", category: "蔬菜", cal: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, serving: 100, source: "USDA" },
  { name: "生菜", category: "蔬菜", cal: 15, protein: 1.4, carbs: 2.9, fat: 0.2, fiber: 1.3, serving: 100, source: "USDA" },
  { name: "番茄", category: "蔬菜", cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, serving: 100, source: "USDA" },
  { name: "黄瓜", category: "蔬菜", cal: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, serving: 100, source: "USDA" },
  { name: "胡萝卜", category: "蔬菜", cal: 41, protein: 0.9, carbs: 9.6, fat: 0.2, fiber: 2.8, serving: 100, source: "USDA" },
  // 水果
  { name: "苹果", category: "水果", cal: 53, protein: 0.3, carbs: 13.8, fat: 0.2, fiber: 2.4, serving: 200, source: "USDA" },
  { name: "香蕉", category: "水果", cal: 93, protein: 1.4, carbs: 22, fat: 0.2, fiber: 2.6, serving: 120, source: "USDA" },
  { name: "蓝莓", category: "水果", cal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, fiber: 2.4, serving: 100, source: "USDA" },
  { name: "牛油果", category: "水果", cal: 160, protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, serving: 100, source: "USDA" },
  { name: "橙子", category: "水果", cal: 47, protein: 0.9, carbs: 11.8, fat: 0.1, fiber: 2.4, serving: 200, source: "USDA" },
  // 零食
  { name: "花生酱", category: "零食", cal: 589, protein: 25, carbs: 20, fat: 50, fiber: 6, serving: 16, source: "USDA" },
  { name: "混合坚果", category: "零食", cal: 607, protein: 20, carbs: 21, fat: 54, fiber: 7, serving: 30, source: "USDA" },
  { name: "蛋白棒", category: "零食", brand: "市售", cal: 380, protein: 30, carbs: 40, fat: 10, fiber: 8, serving: 60, source: "商品营养标签" },
  { name: "黑巧克力（85%）", category: "零食", cal: 598, protein: 7.9, carbs: 46, fat: 43, fiber: 11, serving: 20, source: "USDA" },
  // 饮料
  { name: "乳清蛋白粉", category: "饮料", brand: "市售", cal: 380, protein: 78, carbs: 8, fat: 5, fiber: 2, serving: 30, source: "商品营养标签" },
  { name: "黑咖啡", category: "饮料", cal: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, serving: 250, source: "USDA" },
  { name: "无糖可乐", category: "饮料", cal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, serving: 330, source: "商品营养标签" },
  // 调味料
  { name: "橄榄油", category: "调味料", cal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, serving: 10, source: "USDA" },
  { name: "酱油", category: "调味料", cal: 63, protein: 5.6, carbs: 9.9, fat: 0.1, fiber: 0.8, serving: 15, source: "中国食物成分表" },
  // 其他
  { name: "豆腐（北）", category: "其他", cal: 76, protein: 8, carbs: 1.9, fat: 4.8, fiber: 0.3, serving: 150, source: "中国食物成分表" },
  // ===== 扩充：常见健身饮食 =====
  { name: "糙米（熟）", category: "主食", cal: 112, protein: 2.6, carbs: 24, fat: 0.9, fiber: 1.8, serving: 150, source: "USDA" },
  { name: "荞麦面（煮）", category: "主食", cal: 99, protein: 3.4, carbs: 21, fat: 0.1, fiber: 2.4, serving: 150, source: "USDA" },
  { name: "土豆（蒸）", category: "主食", cal: 77, protein: 2, carbs: 17, fat: 0.1, fiber: 2.2, serving: 150, source: "USDA" },
  { name: "火鸡胸肉", category: "肉类", cal: 135, protein: 29, carbs: 0, fat: 1.6, fiber: 0, serving: 150, source: "USDA" },
  { name: "金枪鱼（水浸）", category: "肉类", cal: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, serving: 120, source: "USDA" },
  { name: "巴沙鱼", category: "肉类", cal: 90, protein: 15, carbs: 0, fat: 3, fiber: 0, serving: 150, source: "USDA" },
  { name: "牛肉干", category: "肉类", cal: 410, protein: 33, carbs: 33, fat: 12, fiber: 1, serving: 30, source: "USDA" },
  { name: "鹌鹑蛋", category: "蛋类", cal: 158, protein: 13, carbs: 2.5, fat: 11, fiber: 0, serving: 50, source: "中国食物成分表" },
  { name: "无糖豆浆", category: "奶制品", cal: 33, protein: 3.3, carbs: 1.2, fat: 1.5, fiber: 0.8, serving: 250, source: "中国食物成分表" },
  { name: "茅屋奶酪", category: "奶制品", cal: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, serving: 100, source: "USDA" },
  { name: "芦笋", category: "蔬菜", cal: 20, protein: 2.2, carbs: 3.9, fat: 0.1, fiber: 2.1, serving: 100, source: "USDA" },
  { name: "蘑菇", category: "蔬菜", cal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1, serving: 100, source: "USDA" },
  { name: "青椒", category: "蔬菜", cal: 20, protein: 0.9, carbs: 4.6, fat: 0.2, fiber: 1.7, serving: 100, source: "USDA" },
  { name: "西葫芦", category: "蔬菜", cal: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, serving: 100, source: "USDA" },
  { name: "草莓", category: "水果", cal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, serving: 150, source: "USDA" },
  { name: "猕猴桃", category: "水果", cal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, serving: 100, source: "USDA" },
  { name: "葡萄", category: "水果", cal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, serving: 150, source: "USDA" },
  { name: "全麦饼干", category: "零食", cal: 450, protein: 8, carbs: 65, fat: 16, fiber: 5, serving: 30, source: "商品营养标签" },
  { name: "无糖酸奶", category: "奶制品", cal: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, serving: 150, source: "中国食物成分表" },
];

export function buildFoodSeed(): Food[] {
  const now = nowISO();
  return FOODS.map((f) => ({
    id: genId("food"),
    user_id: null,
    name: f.name,
    category: f.category,
    brand: f.brand ?? null,
    calories_per_100g: f.cal,
    protein_per_100g: f.protein,
    carbs_per_100g: f.carbs,
    fat_per_100g: f.fat,
    fiber_per_100g: f.fiber,
    serving_size: f.serving ?? 100,
    source: f.source,
    is_custom: false,
    created_at: now,
    updated_at: now,
  }));
}
