"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { copyPlanAsMine, getExerciseById, getPlanById, getPlanExercises } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";

function PlanDetailInner() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const plan = getPlanById(params.id);
  const items = plan ? getPlanExercises(plan.id) : [];
  const isTemplate = !!plan && plan.user_id === null;

  if (!plan) {
    return (
      <PageContainer title="计划详情" back>
        <p className="mt-16 text-center text-sm text-ink-2">未找到该计划</p>
      </PageContainer>
    );
  }

  const days = [...new Set(items.map((i) => i.day))].sort((a, b) => a - b);

  function handleCopy() {
    if (!plan) return;
    const mine = copyPlanAsMine(plan.id);
    notifyDataChanged();
    router.push(`/workout/plans/${mine.id}`);
  }

  return (
    <PageContainer title={plan.name} subtitle={plan.description} back>
      {isTemplate && (
        <button
          onClick={handleCopy}
          className="mb-4 w-full rounded-xl bg-brand py-3 text-sm font-bold text-white active:opacity-90"
        >
          复制为我的计划
        </button>
      )}
      <div className="space-y-4">
        {days.map((day) => {
          const dayItems = items.filter((i) => i.day === day);
          const isRest = dayItems.length === 0;
          const bodyPart = dayItems[0]?.body_part ?? "休息 / 主动恢复";
          const totalSets = dayItems.reduce((a, i) => a + i.sets, 0);

          return (
            <Card key={day}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-white">
                    D{day}
                  </span>
                  <p className="text-sm font-bold text-ink">{bodyPart}</p>
                </div>
                {!isRest && (
                  <Link
                    href={`/workout/session?planId=${plan.id}&day=${day}`}
                    className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white active:opacity-90"
                  >
                    开始训练
                  </Link>
                )}
              </div>

              {isRest ? (
                <p className="py-3 text-center text-xs text-ink-3">今天是休息日，可以散步、拉伸等主动恢复</p>
              ) : (
                <div className="divide-y divide-line">
                  {dayItems.map((item) => {
                    const ex = getExerciseById(item.exercise_id);
                    if (!ex) return null;
                    return (
                      <Link
                        key={item.id}
                        href={`/workout/exercises/${ex.id}`}
                        className="flex items-center gap-2 py-2.5 active:bg-surface-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{ex.name}</p>
                          <p className="text-[11px] text-ink-3">{ex.primary_muscle}</p>
                        </div>
                        <div className="shrink-0 text-right text-[11px] leading-4 text-ink-2">
                          <p className="text-sm font-bold text-ink">
                            {item.sets} × {item.reps}
                          </p>
                          <p>RIR {item.rir} · 休息 {item.rest_sec}s</p>
                        </div>
                      </Link>
                    );
                  })}
                  <p className="pt-2 text-right text-[11px] text-ink-3">本日共 {totalSets} 组</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

export default function PlanDetailPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="计划详情" back>
          <p className="mt-16 text-center text-sm text-ink-3">加载中…</p>
        </PageContainer>
      }
    >
      <PlanDetailInner />
    </Suspense>
  );
}
