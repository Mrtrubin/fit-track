"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getGoal, getProfile } from "@/lib/db";
import { useDbVersion } from "@/store/dbStore";
import { calcBmr, calcTdee } from "@/lib/calc/calories";
import { ACTIVITY_LABELS, GOAL_LABELS } from "@/lib/constants";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/layout/icons";

export default function ProfilePage() {
  useDbVersion();
  const profile = getProfile();
  const goal = getGoal();

  const calc = useMemo(() => {
    if (!profile || !goal) return null;
    const bmr = calcBmr({
      gender: profile.gender,
      weightKg: profile.weight_kg,
      heightCm: profile.height_cm,
      age: profile.age,
    });
    const tdee = calcTdee(bmr, profile.activity_level);
    return { bmr, tdee };
  }, [profile, goal]);

  if (!profile || !goal || !calc) {
    return (
      <PageContainer title="我的">
        <div className="mt-20 flex flex-col items-center text-center">
          <p className="text-sm text-ink-2">还没有完成初始化</p>
          <Link href="/setup" className="mt-4 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white">
            去初始化
          </Link>
        </div>
      </PageContainer>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: "性别", value: profile.gender === "male" ? "男" : "女" },
    { label: "年龄", value: `${profile.age} 岁` },
    { label: "身高", value: `${profile.height_cm} cm` },
    { label: "体重", value: `${profile.weight_kg} kg` },
    { label: "体脂率", value: profile.body_fat_pct != null ? `${profile.body_fat_pct}%` : "未记录" },
    { label: "活动水平", value: ACTIVITY_LABELS[profile.activity_level] },
    { label: "每周训练", value: `${profile.training_days_per_week} 天 · ${profile.training_minutes_per_session} 分钟/次` },
  ];

  return (
    <PageContainer title="我的">
      {/* 资料卡 */}
      <SectionTitle title="个人资料" right={<Link href="/profile/edit" className="text-sm font-semibold text-brand">编辑</Link>} />
      <Card className="mb-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-lg font-extrabold text-white">
            {profile.name.slice(0, 1)}
          </div>
          <div>
            <p className="text-base font-bold text-ink">{profile.name}</p>
            <p className="text-xs text-ink-3">{GOAL_LABELS[profile.goal]}目标</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-2 border-b border-line pb-1.5 text-sm">
              <span className="text-ink-3">{r.label}</span>
              <span className="font-medium text-ink">{r.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 热量计算 */}
      <SectionTitle title="热量计算" right={<Link href="/profile/goals" className="text-sm font-semibold text-brand">调整目标</Link>} />
      <Card className="mb-5 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] text-ink-3">基础代谢 BMR</p>
            <p className="text-lg font-bold text-ink">{calc.bmr} kcal/天</p>
          </div>
          <div className="rounded-lg bg-surface-2 px-3 py-2.5">
            <p className="text-[11px] text-ink-3">预计每日总消耗 TDEE</p>
            <p className="text-lg font-bold text-ink">{calc.tdee} kcal/天</p>
          </div>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <div>
            <p className="text-[11px] text-ink-3">目标热量（{GOAL_LABELS[goal.goal]}）</p>
            <p className="text-xs text-ink-3">蛋白质 {goal.protein_g}g · 碳水 {goal.carbs_g}g · 脂肪 {goal.fat_g}g</p>
          </div>
          <p className="text-2xl font-extrabold text-brand">{goal.target_calories} kcal</p>
        </div>
        <p className="text-[11px] leading-relaxed text-ink-3">
          这是身体在完全静息状态下维持基本生命活动的估算能量需求。TDEE 为估算值，实际消耗会受到活动量、训练量、睡眠等因素影响。
        </p>
      </Card>

      {/* 功能入口 */}
      <SectionTitle title="我的管理" />
      <Card className="mb-5 divide-y divide-line px-0 py-0">
        {[
          { label: "我的食物", href: "/diet/foods", desc: "自定义食物管理" },
          { label: "我的计划", href: "/workout/plans", desc: "训练计划管理" },
          { label: "设置", href: "/profile/settings", desc: "应用与数据设置" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="text-xs text-ink-3">{item.desc}</p>
            </div>
            <ChevronRightIcon width={18} height={18} className="text-ink-3" />
          </Link>
        ))}
      </Card>
    </PageContainer>
  );
}
