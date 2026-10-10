"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllDayEntries,
  getDailyCalories,
  getGoal,
  getLatestBodyRecord,
  getProfile,
  getSessions,
  saveDailyCalories,
  seedIfNeeded,
} from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { notifyDataChanged, useDbVersion } from "@/store/dbStore";
import { calcBmr, calcTdee } from "@/lib/calc/calories";
import { estimateExerciseBurn, sumNutrition } from "@/lib/calc/nutrition";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import BodyRecordForm from "@/components/data/BodyRecordForm";
import { DietIcon, FireIcon, ScaleIcon, WorkoutIcon } from "@/components/layout/icons";

function todayText() {
  return new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" });
}

export default function HomePage() {
  useDbVersion();
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [weightFormOpen, setWeightFormOpen] = useState(false);
  const [strengthMin, setStrengthMin] = useState<string>("");
  const [cardioMin, setCardioMin] = useState<string>("");

  useEffect(() => {
    seedIfNeeded();
    setHasProfile(!!getProfile());
    setReady(true);
  }, []);

  // ===== 未初始化 =====
  if (!ready || !hasProfile) {
    return (
      <PageContainer withBottomNav={false}>
        <div className="flex min-h-[82vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
            <WorkoutIcon width={32} height={32} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">我的健身</h1>
          <p className="mt-1 text-sm text-ink-2">FitTrack · 科学记录你的饮食与训练</p>
          <p className="mt-6 max-w-[280px] text-sm leading-relaxed text-ink-2">
            记录热量、蛋白质、训练与体重，帮你稳步达成健身目标。
          </p>
          <Link
            href="/setup"
            className="mt-8 rounded-xl bg-brand px-8 py-3 font-semibold text-white shadow-lg shadow-brand/30 active:opacity-90"
          >
            开始使用
          </Link>
          <p className="mt-3 text-xs text-ink-3">只需一分钟完成初始化</p>
        </div>
      </PageContainer>
    );
  }

  // ===== 已初始化：真实数据整合 =====
  const profile = getProfile()!;
  const goal = getGoal();
  const date = todayStr();
  const totals = sumNutrition(getAllDayEntries(date));
  const todaySessions = getSessions().filter((s) => s.date === date);
  const latestBody = getLatestBodyRecord();
  const dc = getDailyCalories(date);

  const bmr = calcBmr({
    gender: profile.gender,
    weightKg: profile.weight_kg,
    heightCm: profile.height_cm,
    age: profile.age,
  });
  const tdee = calcTdee(bmr, profile.activity_level);

  const burn = estimateExerciseBurn(
    strengthMin === "" ? (dc?.strength_min ?? 0) : Number(strengthMin),
    cardioMin === "" ? (dc?.cardio_min ?? 0) : Number(cardioMin),
  );

  function handleBurnSave() {
    saveDailyCalories(date, {
      strength_min: strengthMin === "" ? (dc?.strength_min ?? 0) : Number(strengthMin),
      cardio_min: cardioMin === "" ? (dc?.cardio_min ?? 0) : Number(cardioMin),
      exercise_burn_est: burn,
    });
    notifyDataChanged();
  }

  const remain = goal ? Math.round(goal.target_calories - totals.calories) : 0;

  return (
    <PageContainer>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-ink-3">{todayText()}</p>
          <h1 className="text-xl font-extrabold text-ink">{profile.name}，加油</h1>
        </div>
      </header>

      {/* 工作台入口 */}
      <Link href="/workspace" className="mb-5 flex items-center justify-between rounded-2xl bg-gradient-to-r from-brand to-brand/80 p-4 text-white shadow-lg shadow-brand/20 active:opacity-90">
        <div>
          <p className="text-sm font-bold">AI 工作台</p>
          <p className="mt-0.5 text-xs text-white/80">一眼看完你的健身数据汇总</p>
        </div>
        <span className="text-xl">›</span>
      </Link>

      {/* 今日热量 */}
      <SectionTitle title="今日热量" />
      <Card className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <FireIcon width={22} height={22} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-ink-3">今日摄入</p>
            <p className="text-2xl font-extrabold leading-none text-ink">
              {Math.round(totals.calories)}
              <span className="text-sm font-normal text-ink-3"> / {goal?.target_calories ?? "--"} kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-ink-3">还可摄入</p>
            <p className={`text-lg font-bold ${remain >= 0 ? "text-success" : "text-danger"}`}>
              {remain >= 0 ? remain : -remain} kcal
            </p>
            {remain < 0 && <p className="text-[10px] text-danger">已超出目标</p>}
          </div>
        </div>
        {goal && <ProgressBar value={totals.calories} max={goal.target_calories} label="热量进度" />}
      </Card>

      {/* 今日营养 */}
      <SectionTitle title="今日营养" />
      <Card className="mb-5 space-y-3">
        {[
          { label: "蛋白质", v: totals.protein, target: goal?.protein_g ?? 0, color: "var(--color-brand)", unit: "g" },
          { label: "碳水", v: totals.carbs, target: goal?.carbs_g ?? 0, color: "#0ea5e9", unit: "g" },
          { label: "脂肪", v: totals.fat, target: goal?.fat_g ?? 0, color: "#eab308", unit: "g" },
        ].map((m) => (
          <div key={m.label}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink-2">{m.label}</span>
              <span className="font-semibold text-ink">
                {Math.round(m.v)} / {m.target} {m.unit}
              </span>
            </div>
            <ProgressBar value={m.v} max={m.target} color={m.color} height={6} />
          </div>
        ))}
        <Link href="/diet" className="block pt-1 text-center text-xs font-semibold text-brand">
          去记录饮食
        </Link>
      </Card>

      {/* 今日消耗（估算） */}
      <SectionTitle title="今日消耗" right={<span className="text-[10px] text-ink-3">运动消耗为估算值</span>} />
      <Card className="mb-5">
        <div className="mb-3 grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[11px] text-ink-3">基础代谢 BMR</p>
            <p className="font-bold text-ink">{bmr}</p>
          </div>
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[11px] text-ink-3">日常活动</p>
            <p className="font-bold text-ink">+{tdee - bmr}</p>
          </div>
          <div className="rounded-lg bg-surface-2 px-2 py-2">
            <p className="text-[11px] text-ink-3">训练 + 有氧（估）</p>
            <p className="font-bold text-brand">+{burn}</p>
          </div>
          <div className="rounded-lg bg-brand-soft px-2 py-2">
            <p className="text-[11px] text-ink-3">预计总消耗</p>
            <p className="font-extrabold text-brand">{tdee + burn}</p>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="mb-1 text-[11px] text-ink-3">力量训练（分钟）</p>
            <input
              type="number"
              inputMode="numeric"
              value={strengthMin === "" ? (dc?.strength_min ?? "") : strengthMin}
              onChange={(e) => setStrengthMin(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
            />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-[11px] text-ink-3">有氧（分钟）</p>
            <input
              type="number"
              inputMode="numeric"
              value={cardioMin === "" ? (dc?.cardio_min ?? "") : cardioMin}
              onChange={(e) => setCardioMin(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={handleBurnSave}
            className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white active:opacity-90"
          >
            估算
          </button>
        </div>
      </Card>

      {/* 今日训练 */}
      <SectionTitle title="今日训练" right={<Link href="/workout" className="text-sm font-semibold text-brand">查看</Link>} />
      <Card className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <WorkoutIcon width={22} height={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">
              {todaySessions.length > 0 ? `已完成 ${todaySessions.length} 次训练` : "今天还没有训练"}
            </p>
            <p className="text-xs text-ink-3">
              {todaySessions.length > 0 ? todaySessions[0].title : "完成训练，保持渐进超负荷"}
            </p>
          </div>
        </div>
        {todaySessions.length === 0 && (
          <Link href="/workout/session" className="text-sm font-semibold text-brand">
            去训练
          </Link>
        )}
      </Card>

      {/* 体重 */}
      <SectionTitle title="体重" />
      <Card className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <ScaleIcon width={22} height={22} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">
              {latestBody ? `${latestBody.weight_kg} kg` : "记录今天的体重"}
            </p>
            <p className="text-xs text-ink-3">
              {latestBody ? `记录于 ${latestBody.date}` : "开始追踪体重变化"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setWeightFormOpen(true)}
          className="rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white active:opacity-90"
        >
          记录体重
        </button>
      </Card>

      {/* 快速操作 */}
      <SectionTitle title="快速操作" />
      <div className="mb-4 grid grid-cols-3 gap-3">
        <button onClick={() => setWeightFormOpen(true)}>
          <Card className="py-3 text-center">
            <ScaleIcon width={20} height={20} className="mx-auto mb-1 text-brand" />
            <span className="text-sm font-medium text-ink">记录体重</span>
          </Card>
        </button>
        <Link href="/diet">
          <Card className="py-3 text-center">
            <DietIcon width={20} height={20} className="mx-auto mb-1 text-brand" />
            <span className="text-sm font-medium text-ink">添加食物</span>
          </Card>
        </Link>
        <Link href="/workout/session">
          <Card className="py-3 text-center">
            <WorkoutIcon width={20} height={20} className="mx-auto mb-1 text-brand" />
            <span className="text-sm font-medium text-ink">开始训练</span>
          </Card>
        </Link>
      </div>

      <BodyRecordForm open={weightFormOpen} onClose={() => setWeightFormOpen(false)} />
    </PageContainer>
  );
}
