# 我的健身 · FitTrack

个人健身管理网站：记录饮食热量、训练重量、身体变化，科学渐进超负荷。

## 技术栈

- **Next.js 16**（App Router + Turbopack）
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4**
- **Recharts 3**（趋势图表）
- 数据层：**LocalStorage 为主缓存 + Supabase 云同步**（表结构按 **Supabase + PostgreSQL + RLS** 规范设计）

## 快速开始

```bash
pnpm install       # 安装依赖（已装可跳过）
pnpm dev           # 开发模式 → http://localhost:3000
pnpm build         # 生产构建
pnpm start         # 生产模式预览
pnpm test          # 端到端冒烟测试（37 项断言）
```

## 功能

- 初始化向导：个人资料 + 目标（减脂/增肌/维持/身体重组）
- Mifflin-St Jeor BMR → TDEE → 目标热量（含极低热量警告）
- 蛋白质/碳水/脂肪目标自动分配（蛋白 1.6~2.2 g/kg 可调）
- 食物库：58 种内置食物 + 自定义食物增删改搜，按每 100g 折算营养
- 每日四餐记录（早餐/午餐/晚餐/加餐）+ 全天营养进度条
- 动作库：37 个动作（步骤/注意事项/常见错误/推荐组次）
- 训练计划生成器：新手/基础/进阶 × 减脂/增肌/维持/力量 × 3/4/5/6 天
- **热门博主计划**：谭成义三分化/新手四分化/居家哑铃四分化、橙子胸部强化周期，一键复制为我的计划
- 训练记录：组数、重量、次数、RPE、RIR，**一键填入上次重量**，自动显示上次数据
- 渐进超负荷建议：达上限 + 高 RIR → 建议增重；未达标 → 维持
- 身体数据：体重/体脂/围度，7/30/90/全部趋势图
- 体重分析：7 日平均 + 周变化 + 减脂/增肌速度建议
- 数据仪表盘：当前/平均体重、平均摄入、训练组数、力量变化
- **数据导出**：完整 JSON 备份 + 身体/饮食/训练/食物 CSV
- **云端同步（Supabase）**：设置页登录后自动备份到云端，多设备同步，RLS 数据隔离
- 用户数据隔离（按 user_id），云端启用 Row Level Security

## 启用云端同步（Supabase）

1. 在 [supabase.com](https://supabase.com) 创建免费项目
2. 打开 **SQL Editor**，执行项目内 `supabase/schema.sql`（建表 + 索引 + RLS 策略 + 触发器）
3. 复制 `.env.local.example` 为 `.env.local`，填入项目 URL 与 anon key（项目 → Settings → API）
4. 重启 `npm run dev`，进入 **我的 → 设置 → 云端同步**，注册/登录邮箱账号，自动同步

同步策略：本地先写（秒开、离线可用），写入同时异步推送云端；新设备登录后自动拉取。数据库 RLS 保证每个用户只能访问自己的数据。

## 项目结构

```
src/
├── app/                    # 页面路由（App Router）
│   ├── page.tsx            # 首页：今日热量/营养/消耗/训练/体重
│   ├── setup/              # 初始化向导
│   ├── diet/               # 饮食：今日饮食、食物库、添加/编辑、历史
│   ├── workout/            # 训练：今日训练、计划、动作库、会话、历史
│   ├── data/               # 数据仪表盘 + 趋势图表
│   └── profile/            # 我的：资料、目标、设置
├── components/
│   ├── layout/             # 底部导航、页面容器、图标
│   ├── ui/                 # 卡片、进度条、表单组件
│   ├── diet/               # 饮食组件（餐次、食物选择器、表单）
│   ├── workout/            # 训练会话追踪器
│   └── data/               # 身体记录表单、趋势图
├── lib/
│   ├── db/                 # 数据访问层（LocalStorage 实现，Supabase 结构）
│   │   ├── localStorage.ts # 表引擎
│   │   └── index.ts        # 业务 API（未来替换为 Supabase 客户端）
│   ├── calc/               # 计算逻辑：热量/宏量/营养/计划生成/渐进超负荷/体重分析
│   ├── seed/               # 内置食物库与动作库
│   └── constants.ts        # 业务常量
├── store/                  # 数据变更订阅
└── types/                  # 数据表类型（对齐 Supabase）
scripts/smoke-test.mjs      # 端到端冒烟测试
```

## 数据表（未来 Supabase 迁移）

users, profiles, foods, daily_food_logs, food_log_items, exercises,
workout_plans, workout_plan_exercises, workout_sessions, workout_sets,
body_records, goals, daily_calories —— 全部按 user_id 隔离，迁移时启用 Row Level Security。
