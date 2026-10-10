"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { saveGoal, saveProfile } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import { calcBmr, calcTargetCalories, calcTdee, type TargetCaloriesMode } from "@/lib/calc/calories";
import { calcMacros } from "@/lib/calc/macros";
import {
  ACTIVITY_LABELS,
  DEFAULT_PROTEIN_FACTOR,
  FAT_LOSS_PACES,
  GOAL_LABELS,
  MUSCLE_GAIN_PACES,
  PROTEIN_FACTORS,
} from "@/lib/constants";
import type { ActivityLevel, FatLossPace, Gender, GoalType, MuscleGainPace } from "@/types";
import { Field, NumberInput, PrimaryButton, Segmented, Select, TextInput } from "@/components/ui/form";
import { Card } from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";

const STEPS = ["基本信息", "活动水平", "目标设定"];

export default function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // 基本信息
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [bodyFat, setBodyFat] = useState<number | "">("");
  // 活动
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [minutes, setMinutes] = useState(60);
  // 目标
  const [goal, setGoal] = useState<GoalType>("fat_loss");
  const [fatPace, setFatPace] = useState<FatLossPace>("standard");
  const [gainPace, setGainPace] = useState<MuscleGainPace>("standard");
  const [proteinFactor, setProteinFactor] = useState(DEFAULT_PROTEIN_FACTOR);

  const canNext =
    step === 0
      ? name.trim() !== "" && age !== "" && height !== "" && weight !== ""
      : true;

  /** 实时计算预览 */
  const preview = useMemo(() => {
    if (age === "" || height === "" || weight === "") return null;
    const bmr = calcBmr({ gender, weightKg: Number(weight), heightCm: Number(height), age: Number(age) });
    const tdee = calcTdee(bmr, activity);
    const mode: TargetCaloriesMode =
      goal === "fat_loss"
        ? { goal, pace: fatPace }
        : goal === "muscle_gain"
          ? { goal, pace: gainPace }
          : { goal };
    const target = calcTargetCalories(tdee, mode);
    const macros = calcMacros({ weightKg: Number(weight), targetCalories: target.calories, proteinFactor });
    return { bmr, tdee, target, macros };
  }, [gender, age, height, weight, activity, goal, fatPace, gainPace, proteinFactor]);

  function handleFinish() {
    if (!preview) return;
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
      goal,
    });
    saveGoal({
      goal,
      target_calories: preview.target.calories,
      protein_g: preview.macros.protein_g,
      carbs_g: preview.macros.carbs_g,
      fat_g: preview.macros.fat_g,
      protein_factor: proteinFactor,
      fat_factor: 0.8,
      pace: goal === "fat_loss" ? fatPace : goal === "muscle_gain" ? gainPace : undefined,
    });
    notifyDataChanged();
    router.push("/");
  }

  return (
    <PageContainer title="初始化" subtitle={`第 ${step + 1} 步 / 共 3 步`} withBottomNav={false}>
      {/* 步骤指示器 */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-brand text-white" : "bg-surface-2 text-ink-3"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i <= step ? "font-semibold text-ink" : "text-ink-3"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-brand" : "bg-line"}`} />}
          </div>
        ))}
      </div>

      {/* 步骤1：基本信息 */}
      {step === 0 && (
        <div className="animate-[fadeIn_.2s_ease]">
          <Field label="姓名 / 昵称" required>
            <TextInput value={name} onChange={setName} placeholder="例如：小明" />
          </Field>
          <Field label="性别" required>
            <Segmented
              options={[
                { value: "male", label: "男" },
                { value: "female", label: "女" },
              ]}
              value={gender}
              onChange={(v) => setGender(v as Gender)}
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="年龄" required>
              <NumberInput value={age} onChange={setAge} placeholder="22" min={10} max={100} unit="岁" />
            </Field>
            <Field label="身高" required>
              <NumberInput value={height} onChange={setHeight} placeholder="180" min={100} max={250} unit="cm" />
            </Field>
            <Field label="体重" required>
              <NumberInput value={weight} onChange={setWeight} placeholder="80" min={30} max={300} step={0.1} unit="kg" />
            </Field>
          </div>
          <Field label="体脂率" hint="可选">
            <NumberInput value={bodyFat} onChange={setBodyFat} placeholder="例如 18" min={3} max={60} step={0.1} unit="%" />
          </Field>
        </div>
      )}

      {/* 步骤2：活动水平 */}
      {step === 1 && (
        <div>
          <Field label="日常活动水平" required>
            <Segmented
              cols={1}
              options={Object.entries(ACTIVITY_LABELS).map(([v, label]) => ({ value: v, label }))}
              value={activity}
              onChange={(v) => setActivity(v as ActivityLevel)}
            />
          </Field>
          <Field label="每周训练次数" required>
            <Segmented
              options={[3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} 天` }))}
              value={String(daysPerWeek)}
              onChange={(v) => setDaysPerWeek(Number(v))}
              cols={4}
            />
          </Field>
          <Field label="每次训练时长" required>
            <Segmented
              options={[30, 45, 60, 90].map((m) => ({ value: String(m), label: `${m} 分钟` }))}
              value={String(minutes)}
              onChange={(v) => setMinutes(Number(v))}
              cols={4}
            />
          </Field>
        </div>
      )}

      {/* 步骤3：目标 */}
      {step === 2 && (
        <div>
          <Field label="健身目标" required>
            <Segmented
              options={[
                { value: "fat_loss", label: "减脂" },
                { value: "muscle_gain", label: "增肌" },
                { value: "maintain", label: "维持" },
                { value: "recomp", label: "身体重组" },
              ]}
              value={goal}
              onChange={(v) => setGoal(v as GoalType)}
            />
          </Field>

          {goal === "fat_loss" && (
            <Field label="减脂节奏" required>
              <Segmented
                cols={1}
                options={Object.entries(FAT_LOSS_PACES).map(([v, p]) => ({ value: v, label: p.label, desc: p.desc }))}
                value={fatPace}
                onChange={(v) => setFatPace(v as FatLossPace)}
              />
            </Field>
          )}
          {goal === "muscle_gain" && (
            <Field label="增肌节奏" required>
              <Segmented
                cols={1}
                options={Object.entries(MUSCLE_GAIN_PACES).map(([v, p]) => ({ value: v, label: p.label, desc: p.desc }))}
                value={gainPace}
                onChange={(v) => setGainPace(v as MuscleGainPace)}
              />
            </Field>
          )}
          {goal === "recomp" && (
            <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2.5 text-xs leading-relaxed text-ink-2">
              身体重组：热量接近每日消耗（略低 100 kcal），重点保持高蛋白摄入并坚持力量训练，实现减脂增肌同步。
            </p>
          )}

          <Field label="蛋白质摄入量" hint={`按体重计算`}>
            <Segmented
              options={PROTEIN_FACTORS.map((f) => ({ value: String(f), label: `${f} g/kg` }))}
              value={String(proteinFactor)}
              onChange={(v) => setProteinFactor(Number(v))}
              cols={4}
            />
          </Field>

          {/* 实时计算结果 */}
          {preview && (
            <Card className="mt-2 space-y-3">
              <div className="text-sm font-semibold text-ink">计算预览</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-surface-2 px-3 py-2">
                  <p className="text-[11px] text-ink-3">基础代谢 BMR</p>
                  <p className="text-base font-bold text-ink">{preview.bmr} kcal/天</p>
                </div>
                <div className="rounded-lg bg-surface-2 px-3 py-2">
                  <p className="text-[11px] text-ink-3">预计每日总消耗 TDEE</p>
                  <p className="text-base font-bold text-ink">{preview.tdee} kcal/天</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] text-ink-3">目标热量（{GOAL_LABELS[goal]}）</p>
                <p className="text-xl font-extrabold text-brand">{preview.target.calories} kcal</p>
              </div>
              {preview.target.warning && (
                <p className="rounded-lg bg-warn/10 px-3 py-2 text-xs leading-relaxed text-warn">
                  {preview.target.warning}
                </p>
              )}
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
              <p className="text-[11px] leading-relaxed text-ink-3">
                这是身体在完全静息状态下维持基本生命活动的估算能量需求。TDEE 为估算值，实际消耗会受到活动量、训练量、睡眠等因素影响。
              </p>
            </Card>
          )}
        </div>
      )}

      {/* 底部操作 */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border border-line bg-surface px-5 py-3.5 text-[15px] font-semibold text-ink active:bg-surface-2"
          >
            上一步
          </button>
        )}
        {step < 2 ? (
          <PrimaryButton disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            下一步
          </PrimaryButton>
        ) : (
          <PrimaryButton disabled={!preview} onClick={handleFinish}>
            完成，开始我的健身之旅
          </PrimaryButton>
        )}
      </div>
    </PageContainer>
  );
}
