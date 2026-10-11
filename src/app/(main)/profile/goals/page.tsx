"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getGoal, getProfile, saveGoal } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import { calcBmr, calcTargetCalories, calcTdee, type TargetCaloriesMode } from "@/lib/calc/calories";
import { calcMacros } from "@/lib/calc/macros";
import {
  DEFAULT_FAT_FACTOR,
  DEFAULT_PROTEIN_FACTOR,
  FAT_LOSS_PACES,
  GOAL_LABELS,
  MUSCLE_GAIN_PACES,
  PROTEIN_FACTORS,
} from "@/lib/constants";
import type { FatLossPace, GoalType, MuscleGainPace } from "@/types";
import { Field, PrimaryButton, Segmented } from "@/components/ui/form";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";

export default function GoalsPage() {
  const router = useRouter();
  const profile = getProfile();
  const goal = getGoal();

  const [goalType, setGoalType] = useState<GoalType>(goal?.goal ?? "fat_loss");
  const [fatPace, setFatPace] = useState<FatLossPace>((goal?.pace as FatLossPace) ?? "standard");
  const [gainPace, setGainPace] = useState<MuscleGainPace>((goal?.pace as MuscleGainPace) ?? "standard");
  const [proteinFactor, setProteinFactor] = useState(goal?.protein_factor ?? DEFAULT_PROTEIN_FACTOR);

  const preview = useMemo(() => {
    if (!profile) return null;
    const bmr = calcBmr({
      gender: profile.gender,
      weightKg: profile.weight_kg,
      heightCm: profile.height_cm,
      age: profile.age,
    });
    const tdee = calcTdee(bmr, profile.activity_level);
    const mode: TargetCaloriesMode =
      goalType === "fat_loss"
        ? { goal: goalType, pace: fatPace }
        : goalType === "muscle_gain"
          ? { goal: goalType, pace: gainPace }
          : { goal: goalType };
    const target = calcTargetCalories(tdee, mode);
    const macros = calcMacros({ weightKg: profile.weight_kg, targetCalories: target.calories, proteinFactor });
    return { bmr, tdee, target, macros };
  }, [profile, goalType, fatPace, gainPace, proteinFactor]);

  if (!profile) {
    return (
      <PageContainer title="我的目标" back>
        <p className="mt-16 text-center text-sm text-ink-2">请先完成初始化</p>
      </PageContainer>
    );
  }

  function handleSave() {
    if (!preview) return;
    saveGoal({
      goal: goalType,
      target_calories: preview.target.calories,
      protein_g: preview.macros.protein_g,
      carbs_g: preview.macros.carbs_g,
      fat_g: preview.macros.fat_g,
      protein_factor: proteinFactor,
      fat_factor: DEFAULT_FAT_FACTOR,
      pace: goalType === "fat_loss" ? fatPace : goalType === "muscle_gain" ? gainPace : undefined,
    });
    notifyDataChanged();
    router.push("/profile");
  }

  return (
    <PageContainer title="我的目标" back>
      <Field label="健身目标" required>
        <Segmented
          options={[
            { value: "fat_loss", label: "减脂" },
            { value: "muscle_gain", label: "增肌" },
            { value: "maintain", label: "维持" },
            { value: "recomp", label: "身体重组" },
          ]}
          value={goalType}
          onChange={(v) => setGoalType(v as GoalType)}
        />
      </Field>

      {goalType === "fat_loss" && (
        <Field label="减脂节奏" required>
          <Segmented
            cols={1}
            options={Object.entries(FAT_LOSS_PACES).map(([v, p]) => ({ value: v, label: p.label, desc: p.desc }))}
            value={fatPace}
            onChange={(v) => setFatPace(v as FatLossPace)}
          />
        </Field>
      )}
      {goalType === "muscle_gain" && (
        <Field label="增肌节奏" required>
          <Segmented
            cols={1}
            options={Object.entries(MUSCLE_GAIN_PACES).map(([v, p]) => ({ value: v, label: p.label, desc: p.desc }))}
            value={gainPace}
            onChange={(v) => setGainPace(v as MuscleGainPace)}
          />
        </Field>
      )}
      {goalType === "recomp" && (
        <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2.5 text-xs leading-relaxed text-ink-2">
          身体重组：热量接近每日消耗（略低 100 kcal），保持高蛋白摄入并坚持力量训练。
        </p>
      )}

      <Field label="蛋白质摄入量">
        <Segmented
          options={PROTEIN_FACTORS.map((f) => ({ value: String(f), label: `${f} g/kg` }))}
          value={String(proteinFactor)}
          onChange={(v) => setProteinFactor(Number(v))}
          cols={4}
        />
      </Field>

      {preview && (
        <Card className="mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-surface-2 px-3 py-2.5">
              <p className="text-[11px] text-ink-3">基础代谢 BMR</p>
              <p className="text-lg font-bold text-ink">{preview.bmr} kcal/天</p>
            </div>
            <div className="rounded-lg bg-surface-2 px-3 py-2.5">
              <p className="text-[11px] text-ink-3">预计每日总消耗 TDEE</p>
              <p className="text-lg font-bold text-ink">{preview.tdee} kcal/天</p>
            </div>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <p className="text-[11px] text-ink-3">目标热量（{GOAL_LABELS[goalType]}）</p>
            <p className="text-2xl font-extrabold text-brand">{preview.target.calories} kcal</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {[
              { label: "蛋白质", v: `${preview.macros.protein_g}g` },
              { label: "碳水", v: `${preview.macros.carbs_g}g` },
              { label: "脂肪", v: `${preview.macros.fat_g}g` },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-surface-2 px-2 py-2">
                <p className="text-[11px] text-ink-3">{m.label}</p>
                <p className="text-sm font-bold text-ink">{m.v}</p>
              </div>
            ))}
          </div>
          {preview.target.warning && (
            <p className="rounded-lg bg-warn/10 px-3 py-2 text-xs leading-relaxed text-warn">{preview.target.warning}</p>
          )}
          <p className="text-[11px] leading-relaxed text-ink-3">
            这是身体在完全静息状态下维持基本生命活动的估算能量需求。TDEE 为估算值，实际消耗会受到活动量、训练量、睡眠等因素影响。
          </p>
        </Card>
      )}

      <PrimaryButton onClick={handleSave} disabled={!preview}>
        保存目标
      </PrimaryButton>
    </PageContainer>
  );
}
