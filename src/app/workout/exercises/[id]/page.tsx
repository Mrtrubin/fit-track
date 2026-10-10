"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { getExerciseById } from "@/lib/db";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS } from "@/lib/constants";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";

function ExerciseDetailInner() {
  const params = useParams<{ id: string }>();
  const ex = getExerciseById(params.id);

  if (!ex) {
    return (
      <PageContainer title="动作详情" back>
        <p className="mt-16 text-center text-sm text-ink-2">未找到该动作</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={ex.name} subtitle={`${ex.primary_muscle}`} back>
      {/* 基本信息 */}
      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-ink-3">主要肌肉</p>
            <p className="font-semibold text-ink">{ex.primary_muscle}</p>
          </div>
          <div>
            <p className="text-xs text-ink-3">辅助肌肉</p>
            <p className="font-semibold text-ink">{ex.secondary_muscle ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-3">器械</p>
            <p className="font-semibold text-ink">{EQUIPMENT_LABELS[ex.equipment]}</p>
          </div>
          <div>
            <p className="text-xs text-ink-3">难度</p>
            <p className="font-semibold text-ink">{DIFFICULTY_LABELS[ex.difficulty]}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-soft px-3.5 py-2.5">
          <span className="text-xs text-ink-2">推荐训练量</span>
          <span className="text-sm font-bold text-brand">
            {ex.recommended_sets} 组 × {ex.recommended_reps} · 休息 {ex.recommended_rest_sec} 秒
          </span>
        </div>
      </Card>

      {/* 动作步骤 */}
      <SectionTitle title="动作步骤" />
      <Card className="mb-5">
        <ol className="space-y-2.5">
          {ex.instructions.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>

      {/* 注意事项 */}
      <SectionTitle title="注意事项" />
      <Card className="mb-5">
        <ul className="space-y-2">
          {ex.tips.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 常见错误 */}
      <SectionTitle title="常见错误" />
      <Card>
        <ul className="space-y-2">
          {ex.common_mistakes.map((m, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageContainer>
  );
}

export default function ExerciseDetailPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="动作详情" back>
          <p className="mt-16 text-center text-sm text-ink-3">加载中…</p>
        </PageContainer>
      }
    >
      <ExerciseDetailInner />
    </Suspense>
  );
}
