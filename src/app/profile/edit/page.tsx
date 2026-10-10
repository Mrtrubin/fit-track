"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getGoal, getProfile, saveGoal, saveProfile } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import { calcBmr, calcTargetCalories, calcTdee, type TargetCaloriesMode } from "@/lib/calc/calories";
import { calcMacros } from "@/lib/calc/macros";
import { ACTIVITY_LABELS, DEFAULT_PROTEIN_FACTOR } from "@/lib/constants";
import type { ActivityLevel, Gender, GoalType } from "@/types";
import { Field, NumberInput, PrimaryButton, Segmented, Select, TextInput } from "@/components/ui/form";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";

export default function ProfileEditPage() {
  const router = useRouter();
  const profile = getProfile();
  const goal = getGoal();

  const [name, setName] = useState(profile?.name ?? "");
  const [gender, setGender] = useState<Gender>(profile?.gender ?? "male");
  const [age, setAge] = useState<number | "">(profile?.age ?? "");
  const [height, setHeight] = useState<number | "">(profile?.height_cm ?? "");
  const [weight, setWeight] = useState<number | "">(profile?.weight_kg ?? "");
  const [bodyFat, setBodyFat] = useState<number | "">(profile?.body_fat_pct ?? "");
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity_level ?? "moderate");
  const [daysPerWeek, setDaysPerWeek] = useState(profile?.training_days_per_week ?? 4);
  const [minutes, setMinutes] = useState(profile?.training_minutes_per_session ?? 60);
  const [goalType, setGoalType] = useState<GoalType>(profile?.goal ?? "fat_loss");

  /** 保存后按新体重重算目标 */
  const recalc = useMemo(() => {
    if (age === "" || height === "" || weight === "") return null;
    const bmr = calcBmr({ gender, weightKg: Number(weight), heightCm: Number(height), age: Number(age) });
    const tdee = calcTdee(bmr, activity);
    const mode: TargetCaloriesMode =
      goalType === "fat_loss"
        ? { goal: "fat_loss", pace: (goal?.pace as "mild" | "standard" | "aggressive") ?? "standard" }
        : goalType === "muscle_gain"
          ? { goal: "muscle_gain", pace: (goal?.pace as "mild" | "standard") ?? "standard" }
          : { goal: goalType };
    const target = calcTargetCalories(tdee, mode);
    const macros = calcMacros({ weightKg: Number(weight), targetCalories: target.calories, proteinFactor: goal?.protein_factor ?? DEFAULT_PROTEIN_FACTOR });
    return { bmr, tdee, target, macros };
  }, [gender, age, height, weight, activity, goalType, goal?.protein_factor, goal?.pace]);

  function handleSave() {
    if (age === "" || height === "" || weight === "" || !recalc) return;
    saveProfile({
      name: name.trim(),
      gender,
      age: Number(age),
      height_cm: Number(height),
      weight_kg: Number(weight),
      body_fat_pct: bodyFat === "" ? null : Number(bodyFat),
      activity_level: activity,
      training_days_per_week: daysPerWeek,
      training_minutes_per_session: minutes,
      goal: goalType,
    });
    saveGoal({
      goal: goalType,
      target_calories: recalc.target.calories,
      protein_g: recalc.macros.protein_g,
      carbs_g: recalc.macros.carbs_g,
      fat_g: recalc.macros.fat_g,
      protein_factor: goal?.protein_factor ?? DEFAULT_PROTEIN_FACTOR,
      fat_factor: 0.8,
      pace: goalType === "fat_loss" || goalType === "muscle_gain" ? (goal?.pace ?? "standard") : undefined,
    });
    notifyDataChanged();
    router.push("/profile");
  }

  return (
    <PageContainer title="编辑资料" back>
      <Field label="姓名 / 昵称" required>
        <TextInput value={name} onChange={setName} />
      </Field>
      <Field label="性别" required>
        <Segmented options={[{ value: "male", label: "男" }, { value: "female", label: "女" }]} value={gender} onChange={(v) => setGender(v as Gender)} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="年龄"><NumberInput value={age} onChange={setAge} min={10} max={100} unit="岁" /></Field>
        <Field label="身高"><NumberInput value={height} onChange={setHeight} min={100} max={250} unit="cm" /></Field>
        <Field label="体重"><NumberInput value={weight} onChange={setWeight} min={30} max={300} step={0.1} unit="kg" /></Field>
      </div>
      <Field label="体脂率" hint="可选">
        <NumberInput value={bodyFat} onChange={setBodyFat} min={3} max={60} step={0.1} unit="%" />
      </Field>
      <Field label="日常活动水平">
        <Select
          value={activity}
          onChange={(v) => setActivity(v as ActivityLevel)}
          options={Object.entries(ACTIVITY_LABELS).map(([v, label]) => ({ value: v, label }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="每周训练">
          <Select
            value={String(daysPerWeek)}
            onChange={(v) => setDaysPerWeek(Number(v))}
            options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} 天` }))}
          />
        </Field>
        <Field label="每次时长">
          <Select
            value={String(minutes)}
            onChange={(v) => setMinutes(Number(v))}
            options={[30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} 分钟` }))}
          />
        </Field>
      </div>
      <Field label="健身目标">
        <Segmented
          options={[
            { value: "fat_loss", label: "减脂" },
            { value: "muscle_gain", label: "增肌" },
            { value: "maintain", label: "维持" },
            { value: "recomp", label: "重组" },
          ]}
          value={goalType}
          onChange={(v) => setGoalType(v as GoalType)}
        />
      </Field>

      {recalc && (
        <Card className="mb-4">
          <p className="text-sm font-semibold text-ink">保存后将更新目标</p>
          <p className="mt-1 text-xs text-ink-3">
            BMR {recalc.bmr} · TDEE {recalc.tdee} · 目标热量{" "}
            <span className="font-bold text-brand">{recalc.target.calories} kcal</span>
          </p>
          <p className="mt-1 text-xs text-ink-3">
            蛋白质 {recalc.macros.protein_g}g · 碳水 {recalc.macros.carbs_g}g · 脂肪 {recalc.macros.fat_g}g
          </p>
          {recalc.target.warning && <p className="mt-2 text-xs text-warn">{recalc.target.warning}</p>}
        </Card>
      )}

      <PrimaryButton onClick={handleSave} disabled={name.trim() === "" || !recalc}>
        保存
      </PrimaryButton>
    </PageContainer>
  );
}
