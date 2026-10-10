"use client";

import { useState } from "react";
import { getAllDayEntries, getGoal, getMealEntries } from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { useDbVersion } from "@/store/dbStore";
import { sumNutrition } from "@/lib/calc/nutrition";
import { MEAL_LABELS, MEAL_ORDER } from "@/lib/constants";
import type { MealType } from "@/types";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import MealSection from "@/components/diet/MealSection";
import FoodPicker from "@/components/diet/FoodPicker";
import { FireIcon } from "@/components/layout/icons";

import { useMounted } from "@/lib/utils/useMounted";

function DietDashboard() {
  useDbVersion();
  const date = todayStr();
  const goal = getGoal();
  const [pickerMeal, setPickerMeal] = useState<MealType | null>(null);

  const all = getAllDayEntries(date);
  const totals = sumNutrition(all);
  const meals = MEAL_ORDER.map((m) => ({ type: m, label: MEAL_LABELS[m], entries: getMealEntries(date, m as MealType) }));

  const remain = goal ? Math.round(goal.target_calories - totals.calories) : 0;

  return (
    <PageContainer title="今日饮食" subtitle={date}>
      {/* 全天热量汇总 */}
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
        {goal && (
          <ProgressBar value={totals.calories} max={goal.target_calories} label="热量进度" />
        )}
      </Card>

      {/* 宏量营养 */}
      <Card className="mb-5 space-y-3">
        <p className="text-sm font-bold text-ink">今日营养</p>
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
      </Card>

      {/* 四餐 */}
      {meals.map((m) => (
        <MealSection key={m.type} label={m.label} entries={m.entries} onAdd={() => setPickerMeal(m.type as MealType)} />
      ))}

      <FoodPicker
        open={pickerMeal !== null}
        onClose={() => setPickerMeal(null)}
        date={date}
        meal={(pickerMeal ?? "breakfast") as MealType}
      />
    </PageContainer>
  );
}

export default function DietPage() {
  const mounted = useMounted();
  if (!mounted) return <PageContainer title="今日饮食" />;
  return <DietDashboard />;
}
