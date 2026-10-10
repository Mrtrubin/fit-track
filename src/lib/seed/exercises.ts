import type { Exercise, MuscleCategory, EquipmentType, Difficulty } from "@/types";
import { genId, nowISO } from "@/lib/db/localStorage";

/**
 * 系统内置健身动作库种子数据。
 * 每个动作包含教学信息（步骤/注意事项/常见错误）与推荐组次。
 */

interface SeedExercise {
  name: string;
  category: MuscleCategory;
  primary: string;
  secondary: string;
  equipment: EquipmentType;
  difficulty: Difficulty;
  instructions: string[];
  tips: string[];
  mistakes: string[];
  sets: number;
  reps: string;
  rest: number;
}

const EXERCISES: SeedExercise[] = [
  // ===== 胸 =====
  {
    name: "杠铃卧推",
    category: "chest", primary: "胸大肌", secondary: "三头肌、三角肌前束",
    equipment: "barbell", difficulty: "beginner",
    instructions: ["平躺于卧推凳，双脚踩实地面，肩胛骨向后下方收紧", "双手略宽于肩握杠，出杠后杠铃位于胸部正上方", "控制杠铃缓慢下放至胸部中下沿，手肘约45°", "发力推起至手臂伸直，顶部不锁死关节"],
    tips: ["肩胛骨全程收紧贴凳", "下放时吸气，推起时呼气", "脚掌蹬地帮助发力，保持身体稳定"],
    mistakes: ["耸肩", "杠铃砸胸反弹", "手肘过度外展", "腰部过度反弓"],
    sets: 4, reps: "8-12", rest: 120,
  },
  {
    name: "上斜哑铃卧推",
    category: "chest", primary: "胸大肌上束", secondary: "三头肌、三角肌前束",
    equipment: "dumbbell", difficulty: "intermediate",
    instructions: ["调整训练凳至30-45°倾斜角，双脚踩实地面", "双手持哑铃置于胸部两侧，收紧肩胛骨", "控制哑铃缓慢下放至胸部两侧，感受胸部拉伸", "推起时保持肩膀稳定，在顶部微微并拢"],
    tips: ["肩胛骨保持稳定贴凳", "手腕保持中立，不要过度后仰", "控制离心阶段，缓慢下放", "不要为了重量牺牲动作幅度"],
    mistakes: ["耸肩", "借力摆动", "下放过快", "重量过大导致幅度不足"],
    sets: 4, reps: "8-12", rest: 120,
  },
  {
    name: "哑铃卧推",
    category: "chest", primary: "胸大肌", secondary: "三头肌、三角肌前束",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["平躺，双手持哑铃举至胸部上方，掌心向前", "肩胛骨收紧贴凳，双脚踩实", "控制哑铃下放至胸部两侧，手肘约45°", "推起至手臂伸直，顶部略并拢"],
    tips: ["相比杠铃活动范围更大", "保持手腕中立", "下放时充分拉伸胸部"],
    mistakes: ["哑铃晃动不稳", "下放过快", "肘部过度外展"],
    sets: 4, reps: "8-12", rest: 90,
  },
  {
    name: "蝴蝶机夹胸",
    category: "chest", primary: "胸大肌", secondary: "三角肌前束",
    equipment: "machine", difficulty: "beginner",
    instructions: ["调整座椅高度，使把手与胸部齐平", "双臂微屈握住把手，背部贴紧靠垫", "控制双臂向中间夹拢，顶峰收缩1秒", "缓慢还原，感受胸部拉伸"],
    tips: ["手臂保持微屈不锁死", "肩胛骨贴靠垫", "夹拢时呼气，还原时吸气"],
    mistakes: ["耸肩", "借力摆动身体", "幅度过大拉扯肩部"],
    sets: 3, reps: "12-15", rest: 90,
  },
  {
    name: "双杠臂屈伸",
    category: "chest", primary: "胸大肌下束", secondary: "三头肌",
    equipment: "bodyweight", difficulty: "intermediate",
    instructions: ["双手撑杠，身体前倾，双腿后收", "屈肘下放身体至胸部有明显拉伸", "发力撑起至手臂伸直"],
    tips: ["身体前倾更多刺激胸部", "保持核心收紧", "控制下放速度"],
    mistakes: ["耸肩", "幅度不足", "摆动借力"],
    sets: 3, reps: "8-12", rest: 120,
  },
  // ===== 背 =====
  {
    name: "高位下拉",
    category: "back", primary: "背阔肌", secondary: "大圆肌、二头肌",
    equipment: "cable", difficulty: "beginner",
    instructions: ["调整大腿挡板，双手宽握横杆", "挺胸沉肩，身体略微后仰", "将横杆拉至锁骨上方，手肘向下向后", "缓慢还原，感受背部拉伸"],
    tips: ["以背部发力带动，不要用手臂硬拉", "拉下时呼气，还原时吸气", "保持躯干稳定，不要过度后仰"],
    mistakes: ["耸肩", "用身体晃动借力", "拉至胸口后方", "还原速度过快"],
    sets: 4, reps: "10-12", rest: 90,
  },
  {
    name: "引体向上",
    category: "back", primary: "背阔肌", secondary: "二头肌、大圆肌",
    equipment: "bodyweight", difficulty: "advanced",
    instructions: ["双手正握单杠，略宽于肩", "收紧肩胛骨，身体自然悬垂", "将身体拉起至下巴过杠", "控制缓慢下放至手臂伸直"],
    tips: ["想象用手肘向下拉", "保持核心收紧，避免摆动", "下放充分拉伸背阔肌"],
    mistakes: ["摆动借力", "半程动作", "耸肩"],
    sets: 3, reps: "6-10", rest: 120,
  },
  {
    name: "杠铃划船",
    category: "back", primary: "背阔肌", secondary: "斜方肌、二头肌、下背",
    equipment: "barbell", difficulty: "intermediate",
    instructions: ["俯身约45°，双手握杠略宽于肩", "背部挺直，核心收紧", "将杠铃拉向腹部，肩胛骨后收", "控制下放至手臂伸直"],
    tips: ["背部保持一条直线", "用背部发力而非手臂", "顶峰收缩1秒"],
    mistakes: ["弓背", "身体过度晃动", "用手臂硬拉"],
    sets: 4, reps: "8-12", rest: 120,
  },
  {
    name: "坐姿划船",
    category: "back", primary: "背阔肌", secondary: "菱形肌、斜方肌、二头肌",
    equipment: "cable", difficulty: "beginner",
    instructions: ["坐姿，双脚踩踏板，膝盖微屈", "挺胸，双手握把", "将把手拉向腹部，肩胛骨后收", "缓慢还原，保持背部张力"],
    tips: ["保持躯干直立不后仰", "肩胛骨充分后收", "动作节奏均匀"],
    mistakes: ["用腰后仰借力", "耸肩", "还原过快"],
    sets: 3, reps: "12-15", rest: 90,
  },
  {
    name: "哑铃单臂划船",
    category: "back", primary: "背阔肌", secondary: "菱形肌、二头肌",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["单膝跪凳，另一手撑凳，背部与地面平行", "持哑铃自然下垂", "将哑铃拉向髋部，肘部贴近身体", "控制下放，充分拉伸背阔肌"],
    tips: ["保持骨盆稳定", "肘部沿身体向上拉", "避免躯干旋转"],
    mistakes: ["身体旋转", "耸肩", "幅度不足"],
    sets: 3, reps: "10-12", rest: 90,
  },
  // ===== 肩 =====
  {
    name: "哑铃推举",
    category: "shoulders", primary: "三角肌前束", secondary: "三头肌、三角肌中束",
    equipment: "dumbbell", difficulty: "intermediate",
    instructions: ["坐姿或站姿，双手持哑铃至肩高", "核心收紧，保持脊柱中立", "将哑铃向上推起至手臂伸直", "控制下放至肩部高度"],
    tips: ["不要过度挺腰", "手腕保持中立", "下放时保持张力"],
    mistakes: ["过度反弓腰部", "耸肩", "推举时哑铃晃动"],
    sets: 4, reps: "8-12", rest: 90,
  },
  {
    name: "哑铃侧平举",
    category: "shoulders", primary: "三角肌中束", secondary: "斜方肌上束",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["双手持哑铃于体侧，肘部微屈", "向两侧抬起手臂至与肩平齐", "顶端稍作停顿", "缓慢下放还原"],
    tips: ["用肩部带动而非甩动", "肘部微屈，不要锁死", "小重量高次数效果更佳"],
    mistakes: ["耸肩", "甩动借力", "举得过高超过肩部", "重量过大"],
    sets: 4, reps: "12-15", rest: 60,
  },
  {
    name: "杠铃推举",
    category: "shoulders", primary: "三角肌前束", secondary: "三头肌、三角肌中束",
    equipment: "barbell", difficulty: "intermediate",
    instructions: ["站姿或坐姿，杠铃置于锁骨前", "收紧核心和臀部", "将杠铃向上推起至头顶", "控制下放回起始位"],
    tips: ["保持核心稳定", "推起时不要过度仰头", "肘部略向前"],
    mistakes: ["过度挺腰", "杠铃路径偏移", "用腿借力"],
    sets: 4, reps: "6-10", rest: 120,
  },
  {
    name: "面拉",
    category: "shoulders", primary: "三角肌后束", secondary: "斜方肌、菱形肌",
    equipment: "cable", difficulty: "beginner",
    instructions: ["绳索调至面部高度，双手握绳", "向后拉，手肘向两侧展开", "将绳索拉向面部两侧，肩胛骨后收", "缓慢还原"],
    tips: ["感受后束和上背收缩", "保持躯干稳定", "顶峰停顿1秒"],
    mistakes: ["用手臂硬拉", "身体后仰", "耸肩"],
    sets: 3, reps: "12-15", rest: 60,
  },
  // ===== 腿 =====
  {
    name: "杠铃深蹲",
    category: "legs", primary: "股四头肌", secondary: "臀大肌、腘绳肌、核心",
    equipment: "barbell", difficulty: "beginner",
    instructions: ["杠铃置于上背，双脚与肩同宽，脚尖略外展", "收紧核心，背部挺直", "屈髋屈膝下蹲至大腿与地面平行或更低", "脚掌蹬地发力站起"],
    tips: ["膝盖与脚尖方向一致", "全程保持胸部打开", "下蹲时吸气，起身时呼气"],
    mistakes: ["膝盖内扣", "弓背", "脚跟离地", "下蹲幅度不足"],
    sets: 4, reps: "8-12", rest: 150,
  },
  {
    name: "腿举",
    category: "legs", primary: "股四头肌", secondary: "臀大肌、腘绳肌",
    equipment: "machine", difficulty: "beginner",
    instructions: ["坐入器械，双脚踩踏板与肩同宽", "解锁后控制踏板下放，膝盖向胸部靠近", "底部不要完全放松", "脚掌发力蹬起，膝盖不完全锁死"],
    tips: ["腰部贴紧靠垫", "膝盖与脚尖方向一致", "控制下放速度"],
    mistakes: ["膝盖内扣", "腰部离垫", "蹬起时锁死膝盖"],
    sets: 4, reps: "10-12", rest: 120,
  },
  {
    name: "罗马尼亚硬拉",
    category: "legs", primary: "腘绳肌", secondary: "臀大肌、下背",
    equipment: "barbell", difficulty: "intermediate",
    instructions: ["双脚与髋同宽，双手握杠", "微屈膝，保持背部挺直", "屈髋向后推送，杠铃沿腿下放至腘绳肌有明显拉伸", "臀部发力将髋部前推站起"],
    tips: ["想象臀部向后坐", "背部全程中立", "杠铃贴近身体"],
    mistakes: ["弓背", "过度屈膝变成深蹲", "下放过快"],
    sets: 4, reps: "8-10", rest: 120,
  },
  {
    name: "腿弯举",
    category: "legs", primary: "腘绳肌", secondary: "小腿肌群",
    equipment: "machine", difficulty: "beginner",
    instructions: ["俯卧或坐姿于腿弯举器械，踝部抵住滚垫", "收缩腘绳肌将小腿向臀部弯起", "顶峰收缩1秒", "缓慢还原"],
    tips: ["避免用腰发力", "全程控制节奏", "髋部贴紧垫面"],
    mistakes: ["抬臀借力", "速度过快", "幅度不足"],
    sets: 3, reps: "10-12", rest: 90,
  },
  {
    name: "箭步蹲",
    category: "legs", primary: "股四头肌", secondary: "臀大肌、腘绳肌",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["双手持哑铃于体侧，一脚向前跨出", "下蹲至前腿大腿与地面平行，后膝接近地面", "前脚蹬地回到起始位", "换腿交替进行"],
    tips: ["前膝与脚尖方向一致", "躯干保持直立", "跨步幅度适中保持平衡"],
    mistakes: ["前膝过度前伸", "身体前倾", "跨步过小"],
    sets: 3, reps: "10-12/腿", rest: 90,
  },
  // ===== 臀 =====
  {
    name: "杠铃臀桥",
    category: "glutes", primary: "臀大肌", secondary: "腘绳肌、核心",
    equipment: "barbell", difficulty: "intermediate",
    instructions: ["仰卧，肩胛骨靠在凳沿，杠铃置于髋部", "双脚踩实，膝盖弯曲", "臀部发力将髋部顶起至躯干与大腿成直线", "顶端夹紧臀部1秒，缓慢下放"],
    tips: ["用臀部发力而非腰部", "顶端充分收缩", "下巴微收，保持中立"],
    mistakes: ["过度挺腰", "幅度不足", "脚跟离地"],
    sets: 4, reps: "10-12", rest: 90,
  },
  {
    name: "髋外展",
    category: "glutes", primary: "臀中肌", secondary: "臀小肌",
    equipment: "machine", difficulty: "beginner",
    instructions: ["坐入髋外展器械，双腿贴住挡板", "核心收紧，向外打开双腿", "顶端停顿1秒", "缓慢还原"],
    tips: ["躯干微前倾更刺激臀中肌", "控制速度", "不要用手扶器械借力"],
    mistakes: ["速度过快", "幅度不足", "用爆发力"],
    sets: 3, reps: "15-20", rest: 60,
  },
  // ===== 二头 =====
  {
    name: "杠铃弯举",
    category: "biceps", primary: "肱二头肌", secondary: "前臂肌群",
    equipment: "barbell", difficulty: "beginner",
    instructions: ["双手握杠与肩同宽，掌心向前", "上臂贴紧身体两侧", "屈肘将杠铃弯举至胸前", "控制下放至手臂伸直"],
    tips: ["避免摆动身体借力", "顶峰收缩", "下放时保持张力"],
    mistakes: ["身体后仰摆动", "肘部前移", "半程动作"],
    sets: 3, reps: "10-12", rest: 90,
  },
  {
    name: "哑铃交替弯举",
    category: "biceps", primary: "肱二头肌", secondary: "前臂肌群",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["双手持哑铃垂于体侧，掌心向前", "交替弯举，前臂在顶端旋外", "缓慢下放", "换另一侧"],
    tips: ["上臂保持固定", "顶峰旋转手腕加强收缩", "控制离心"],
    mistakes: ["摆动借力", "肘部前移", "重量过大"],
    sets: 3, reps: "10-12/臂", rest: 90,
  },
  // ===== 三头 =====
  {
    name: "绳索下压",
    category: "triceps", primary: "肱三头肌", secondary: "—",
    equipment: "cable", difficulty: "beginner",
    instructions: ["面对绳索，双手握把，上臂贴紧身体", "肘部固定，前臂向下压直至手臂伸直", "顶端挤压三头肌1秒", "缓慢还原至前臂与地面平行"],
    tips: ["肘部全程固定", "身体微前倾", "不要耸肩"],
    mistakes: ["肘部外移", "身体前后摆动", "用身体重量下压"],
    sets: 3, reps: "12-15", rest: 60,
  },
  {
    name: "窄距卧推",
    category: "triceps", primary: "肱三头肌", secondary: "胸大肌、三角肌前束",
    equipment: "barbell", difficulty: "intermediate",
    instructions: ["平躺，双手与肩同宽握杠", "肩胛骨收紧", "控制杠铃下放至胸部中下沿", "推起至手臂伸直"],
    tips: ["肘部贴近身体", "手腕保持中立", "下放时控制速度"],
    mistakes: ["手距过窄伤手腕", "肘部外展", "耸肩"],
    sets: 3, reps: "8-12", rest: 90,
  },
  // ===== 腹部 =====
  {
    name: "卷腹",
    category: "abs", primary: "腹直肌", secondary: "腹外斜肌",
    equipment: "bodyweight", difficulty: "beginner",
    instructions: ["仰卧，屈膝，双手轻放耳侧或胸前", "收紧腹部，将肩胛骨卷离地面", "顶端挤压腹肌1秒", "缓慢下放"],
    tips: ["颈部放松，下巴微收", "用腹肌发力而非颈部", "下放时不完全躺平保持张力"],
    mistakes: ["用手拉脖子", "起身过高", "速度过快"],
    sets: 3, reps: "15-20", rest: 60,
  },
  {
    name: "平板支撑",
    category: "abs", primary: "核心肌群", secondary: "腹直肌、腹横肌",
    equipment: "bodyweight", difficulty: "beginner",
    instructions: ["俯卧，前臂撑地，身体成一条直线", "收紧腹部和臀部", "保持姿势，自然呼吸"],
    tips: ["不要塌腰或撅臀", "目光看向地面", "以时间而非次数衡量"],
    mistakes: ["塌腰", "臀部过高", "屏住呼吸"],
    sets: 3, reps: "30-60秒", rest: 60,
  },
  {
    name: "悬垂举腿",
    category: "abs", primary: "腹直肌下部", secondary: "髋屈肌、核心",
    equipment: "bodyweight", difficulty: "advanced",
    instructions: ["悬垂于单杠，双手与肩同宽", "收紧核心，双腿伸直或微屈", "将双腿向上抬起至与地面平行或更高", "控制下放"],
    tips: ["避免摆动", "用腹部发力而非髋部", "下放缓慢"],
    mistakes: ["摆动借力", "弓背", "快速放下"],
    sets: 3, reps: "8-12", rest: 90,
  },
  // ===== 有氧 =====
  {
    name: "跑步机（匀速）",
    category: "cardio", primary: "心肺功能", secondary: "腿部肌群",
    equipment: "cardio", difficulty: "beginner",
    instructions: ["热身5分钟后再进入匀速阶段", "保持中速匀速跑或快走", "注意呼吸节奏，保持步频稳定"],
    tips: ["保持合理心率区间", "补充水分", "结束时逐步减速冷却"],
    mistakes: ["一开始就全力跑", "扶着扶手", "忽略热身冷却"],
    sets: 1, reps: "20-40分钟", rest: 0,
  },
  {
    name: "动感单车",
    category: "cardio", primary: "心肺功能", secondary: "腿部肌群",
    equipment: "cardio", difficulty: "beginner",
    instructions: ["调整座椅高度，膝盖微屈", "保持稳定踏频", "结合阻力和速度变化"],
    tips: ["保持核心稳定", "跟住音乐节奏", "避免膝盖外翻"],
    mistakes: ["阻力过大", "身体过度晃动", "膝盖内扣"],
    sets: 1, reps: "20-40分钟", rest: 0,
  },
  {
    name: "椭圆机",
    category: "cardio", primary: "心肺功能", secondary: "全身肌群",
    equipment: "cardio", difficulty: "beginner",
    instructions: ["双脚踩稳踏板，双手握把", "保持直立，均匀蹬动", "调整阻力保持适中强度"],
    tips: ["低冲击适合恢复日", "保持呼吸均匀", "全程脚掌贴踏板"],
    mistakes: ["借助扶手支撑体重", "步幅过小", "含胸驼背"],
    sets: 1, reps: "20-30分钟", rest: 0,
  },
  // ===== 热门博主计划补充动作 =====
  {
    name: "哑铃飞鸟",
    category: "chest", primary: "胸大肌", secondary: "三角肌前束",
    equipment: "dumbbell", difficulty: "intermediate",
    instructions: ["仰卧平凳，双手持哑铃于胸部上方，掌心相对", "手肘微屈固定角度，向两侧下放哑铃至胸部充分拉伸", "胸部发力将哑铃合拢回起始位"],
    tips: ["手肘角度全程固定", "下放时吸气，控制节奏", "重量不宜过大"],
    mistakes: ["手臂弯曲过大变卧推", "下放过快", "耸肩"],
    sets: 3, reps: "12-15", rest: 60,
  },
  {
    name: "坐姿器械推胸",
    category: "chest", primary: "胸大肌", secondary: "三头肌、三角肌前束",
    equipment: "machine", difficulty: "beginner",
    instructions: ["调整座椅使把手与胸部中部齐平", "背部贴紧靠垫，双手握把", "向前推出至手臂接近伸直", "缓慢还原，感受胸部拉伸"],
    tips: ["肩胛骨贴紧靠垫", "推出时呼气", "避免耸肩"],
    mistakes: ["耸肩", "靠背离垫", "弹震推把"],
    sets: 4, reps: "10-12", rest: 90,
  },
  {
    name: "俯卧撑",
    category: "chest", primary: "胸大肌", secondary: "三头肌、三角肌前束、核心",
    equipment: "bodyweight", difficulty: "beginner",
    instructions: ["双手略宽于肩撑地，身体成一条直线", "屈肘下放至胸部接近地面", "推起至手臂伸直"],
    tips: ["核心全程收紧", "肘部约45°靠近身体", "可做跪姿退阶"],
    mistakes: ["塌腰", "耸肩", "半程动作"],
    sets: 4, reps: "10-15", rest: 60,
  },
  {
    name: "保加利亚分腿蹲",
    category: "legs", primary: "股四头肌", secondary: "臀大肌、腘绳肌",
    equipment: "dumbbell", difficulty: "intermediate",
    instructions: ["单脚站立，后脚脚背置于凳上", "持哑铃垂于体侧，躯干直立", "前腿下蹲至大腿与地面平行", "前脚蹬地站起"],
    tips: ["前膝与脚尖方向一致", "躯干微前倾可更多刺激臀部", "保持骨盆稳定"],
    mistakes: ["前膝过度前伸", "身体晃动", "站起时借力"],
    sets: 3, reps: "10-12/腿", rest: 90,
  },
  {
    name: "哑铃颈后臂屈伸",
    category: "triceps", primary: "肱三头肌长头", secondary: "—",
    equipment: "dumbbell", difficulty: "beginner",
    instructions: ["坐姿或站姿，双手托住哑铃置于头后", "上臂贴近头部，肘部朝上", "前臂向后上方伸直哑铃，挤压三头肌", "缓慢下放还原"],
    tips: ["肘部保持固定", "下放时充分拉伸三头长头", "重量适中控制稳定"],
    mistakes: ["肘部外扩", "借力甩动", "下放过快"],
    sets: 3, reps: "10-12", rest: 60,
  },
  {
    name: "哑铃罗马尼亚硬拉",
    category: "legs", primary: "腘绳肌", secondary: "臀大肌、下背",
    equipment: "dumbbell", difficulty: "intermediate",
    instructions: ["双手持哑铃于体前，微屈膝", "背部挺直，屈髋向后推送", "哑铃沿腿下放至腘绳肌明显拉伸", "臀部发力将髋部前推站起"],
    tips: ["背部全程中立", "哑铃贴近身体", "感受腘绳肌拉伸"],
    mistakes: ["弓背", "过度屈膝", "哑铃远离身体"],
    sets: 3, reps: "10-12", rest: 90,
  },
];

export function buildExerciseSeed(): Exercise[] {
  const now = nowISO();
  return EXERCISES.map((e) => ({
    id: genId("ex"),
    name: e.name,
    category: e.category,
    primary_muscle: e.primary,
    secondary_muscle: e.secondary === "—" ? null : e.secondary,
    equipment: e.equipment,
    difficulty: e.difficulty,
    instructions: e.instructions,
    tips: e.tips,
    common_mistakes: e.mistakes,
    recommended_sets: e.sets,
    recommended_reps: e.reps,
    recommended_rest_sec: e.rest,
    image_url: null,
    video_url: null,
    created_at: now,
  }));
}
