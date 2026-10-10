"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getExerciseById, getPlanExercises, getPlans, getProfile, savePlanWithExercises } from "@/lib/db";
import { notifyDataChanged, useDbVersion } from "@/store/dbStore";
import { generatePlan, PLAN_GOAL_LABELS, type PlanGoal } from "@/lib/calc/planGenerator";
import { TRAINING_LEVELS } from "@/lib/constants";
import type { TrainingLevel } from "@/types";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import { PrimaryButton, Segmented } from "@/components/ui/form";
import { ChevronRightIcon, FireIcon } from "@/components/layout/icons";

export default function PlansPage() {
  useDbVersion();
  const router = useRouter();
  const profile = getProfile();

  const [level, setLevel] = useState<TrainingLevel>("intermediate");
  const [goal, setGoal] = useState<PlanGoal>("muscle_gain");
  const [days, setDays] = useState(4);

  const preview = useMemo(() => generatePlan(level, goal, days), [level, goal, days]);
  const allPlans = getPlans();
  const myPlans = allPlans.filter((p) => p.is_custom);
  const templates = allPlans.filter((p) => p.user_id === null);

  function handleSave() {
    savePlanWithExercises(
      {
        name: preview.name,
        level,
        goal: goal === "strength" ? "maintain" : (goal as "fat_loss" | "muscle_gain" | "maintain"),
        days_per_week: days,
        description: preview.description,
      },
      preview.days.flatMap((d) =>
        d.exercises.map((e, i) => ({
          day: d.day,
          body_part: d.body_part,
          exercise_id: e.exercise_id,
          sets: e.sets,
          reps: e.reps,
          rir: e.rir,
          rest_sec: e.rest_sec,
          sort_order: i,
        })),
      ),
    );
    notifyDataChanged();
    router.push("/workout/plans");
  }

  return (
    <PageContainer title="训练计划" back>
      {!profile && (
        <Card className="mb-4 py-6 text-center text-sm text-ink-3">
          请先完成初始化，系统将结合你的训练水平生成计划
        </Card>
      )}

      <Card className="mb-4 space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">训练水平</p>
          <Segmented
            cols={3}
            options={TRAINING_LEVELS.map((t) => ({ value: t.value, label: t.label, desc: t.desc }))}
            value={level}
            onChange={(v) => setLevel(v as TrainingLevel)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">目标</p>
          <Segmented
            cols={4}
            options={Object.entries(PLAN_GOAL_LABELS).map(([v, label]) => ({ value: v, label }))}
            value={goal}
            onChange={(v) => setGoal(v as PlanGoal)}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">每周训练天数</p>
          <Segmented
            cols={4}
            options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} 天` }))}
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
          />
        </div>
      </Card>

      {/* 预览 */}
      <SectionTitle title="计划预览" />
      <Card className="mb-4">
        <p className="text-base font-bold text-ink">{preview.name}</p>
        <p className="mb-3 mt-0.5 text-xs text-ink-3">{preview.description}</p>
        <div className="space-y-2">
          {preview.days.map((d) => (
            <div key={d.day} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink text-[11px] font-bold text-white">
                D{d.day}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{d.body_part}</p>
                <p className="truncate text-[11px] text-ink-3">
                  {d.exercises.length === 0
                    ? "休息 / 主动恢复"
                    : d.exercises
                        .map((e) => getExerciseById(e.exercise_id)?.name)
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </div>
              {d.exercises.length > 0 && (
                <span className="shrink-0 text-[11px] text-ink-3">
                  {d.exercises.reduce((a, e) => a + e.sets, 0)} 组
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <PrimaryButton onClick={handleSave}>生成并保存为我的计划</PrimaryButton>

      {/* 热门博主计划模板 */}
      <SectionTitle title="热门博主计划" className="mt-6" />
      <p className="mb-3 text-xs text-ink-3">
        收录网络热门健身博主（谭成义、橙子等）的经典分化计划，点进去可直接复制为我的计划
      </p>
      <div className="space-y-3">
        {templates.map((p) => {
          const exCount = getPlanExercises(p.id).length;
          return (
            <Link
              key={p.id}
              href={`/workout/plans/${p.id}`}
              className="block rounded-2xl border border-line bg-surface px-4 py-3.5 active:bg-surface-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <FireIcon width={20} height={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{p.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-2">{p.description}</p>
                  <p className="mt-1.5 text-[11px] text-ink-3">
                    {p.days_per_week} 天 · {exCount} 个动作 · 系统模板
                  </p>
                </div>
                <ChevronRightIcon width={16} height={16} className="mt-2 shrink-0 text-ink-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* 我的计划 */}
      {myPlans.length > 0 && (
        <>
          <SectionTitle title="我的计划" className="mt-6" />
          <Card className="divide-y divide-line px-0 py-0">
            {myPlans.map((p) => (
              <Link key={p.id} href={`/workout/plans/${p.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-surface-2">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-3">
                    {p.days_per_week} 天 · {p.description}
                  </p>
                </div>
                <ChevronRightIcon width={16} height={16} className="text-ink-3" />
              </Link>
            ))}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
