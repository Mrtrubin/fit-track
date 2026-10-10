"use client";

import { useMemo } from "react";
import Link from "next/link";
import { getPlanExercises, getPlans, getSessions } from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { useDbVersion } from "@/store/dbStore";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/layout/icons";

import { useMounted } from "@/lib/utils/useMounted";

function WorkoutDashboard() {
  useDbVersion();
  const today = todayStr();

  const sessions = useMemo(() => getSessions(), []);
  const todayDone = sessions.find((s) => s.date === today);
  const plans = useMemo(() => getPlans().filter((p) => p.is_custom), []);

  /** 根据当前周几推算今天练计划第几天 */
  function todayDayIndex(planId: string, daysPerWeek: number) {
    const items = getPlanExercises(planId);
    const trainDays = [...new Set(items.map((i) => i.day))].filter(
      (d) => items.some((i) => i.day === d && i.body_part !== "休息 / 主动恢复"),
    );
    const idx = (new Date().getDay() + 6) % 7; // 周一=0
    const day = trainDays[idx % Math.max(1, trainDays.length)];
    return day;
  }

  return (
    <PageContainer title="今日训练">
      {/* 今日状态 */}
      {todayDone ? (
        <Card className="mb-5 border-success/30 bg-success/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-success">今日训练已完成 ✓</p>
              <p className="text-xs text-ink-2">
                {todayDone.title} · {todayDone.duration_min ? `${todayDone.duration_min} 分钟` : ""}
              </p>
            </div>
            <Link href="/workout/history" className="text-sm font-semibold text-brand">
              查看记录
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="mb-5">
          <p className="text-sm font-bold text-ink">今天还没有训练</p>
          <p className="mt-0.5 text-xs text-ink-3">完成一次训练，向目标更近一步</p>
          <Link
            href="/workout/session"
            className="mt-3 block rounded-xl bg-brand py-3 text-center text-sm font-bold text-white active:opacity-90"
          >
            开始训练
          </Link>
        </Card>
      )}

      {/* 我的计划 */}
      <SectionTitle title="我的计划" right={<Link href="/workout/plans" className="text-sm font-semibold text-brand">管理</Link>} />
      {plans.length === 0 ? (
        <Card className="mb-5 py-6 text-center text-sm text-ink-3">
          还没有计划，
          <Link href="/workout/plans" className="font-semibold text-brand">
            去生成一个
          </Link>
        </Card>
      ) : (
        <div className="mb-5 space-y-3">
          {plans.map((p) => {
            const day = todayDayIndex(p.id, p.days_per_week);
            const dayItems = getPlanExercises(p.id).filter((i) => i.day === day);
            const bodyPart = dayItems[0]?.body_part ?? "休息";
            const isRest = dayItems.length === 0;
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">{p.name}</p>
                    <p className="text-[11px] text-ink-3">{p.days_per_week} 天计划</p>
                  </div>
                  <Link href={`/workout/plans/${p.id}`} className="text-xs font-semibold text-brand">
                    查看详情
                  </Link>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                  <div>
                    <p className="text-[11px] text-ink-3">今天安排</p>
                    <p className="text-sm font-bold text-ink">{isRest ? "休息 / 主动恢复" : bodyPart}</p>
                  </div>
                  {!isRest && (
                    <Link
                      href={`/workout/session?planId=${p.id}&day=${day}`}
                      className="rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white active:opacity-90"
                    >
                      开始今日训练
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* 快捷入口 */}
      <SectionTitle title="训练工具" />
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "自由训练", href: "/workout/session", desc: "手动添加动作" },
          { label: "动作库", href: "/workout/exercises", desc: "动作教学" },
          { label: "训练历史", href: "/workout/history", desc: "查看记录" },
          { label: "生成计划", href: "/workout/plans", desc: "定制训练计划" },
        ].map((a) => (
          <Link key={a.label} href={a.href}>
            <Card className="py-3.5">
              <p className="text-sm font-bold text-ink">{a.label}</p>
              <p className="mt-0.5 flex items-center text-[11px] text-ink-3">
                {a.desc}
                <ChevronRightIcon width={12} height={12} className="ml-0.5" />
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}

export default function WorkoutPage() {
  const mounted = useMounted();
  if (!mounted) return <PageContainer title="今日训练" />;
  return <WorkoutDashboard />;
}
