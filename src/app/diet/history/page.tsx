"use client";

import { useMemo, useState } from "react";
import { getAllDayEntries } from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { useDbVersion } from "@/store/dbStore";
import { sumNutrition } from "@/lib/calc/nutrition";
import { MEAL_LABELS, MEAL_ORDER } from "@/lib/constants";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/layout/icons";

import { useMounted } from "@/lib/utils/useMounted";

function fmtDate(d: string) {
  const [, m, day] = d.split("-");
  return `${Number(m)}月${Number(day)}日`;
}

function DietHistoryDashboard() {
  useDbVersion();
  const [openDate, setOpenDate] = useState<string | null>(null);

  const days = useMemo(() => {
    const out: { date: string; entries: ReturnType<typeof getAllDayEntries> }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = todayStr(d);
      const entries = getAllDayEntries(date);
      if (entries.length > 0) out.push({ date, entries });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer title="饮食历史" back>
      {days.length === 0 && (
        <Card className="py-10 text-center text-sm text-ink-3">最近 14 天还没有饮食记录</Card>
      )}
      <div className="space-y-3">
        {days.map(({ date, entries }) => {
          const totals = sumNutrition(entries);
          const open = openDate === date;
          return (
            <Card key={date} className="py-3">
              <button
                onClick={() => setOpenDate(open ? null : date)}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{fmtDate(date)}</p>
                  <p className="text-[11px] text-ink-3">
                    {entries.length} 个条目 · 蛋白 {Math.round(totals.protein)}g 碳水 {Math.round(totals.carbs)}g 脂肪{" "}
                    {Math.round(totals.fat)}g
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-ink">{Math.round(totals.calories)}</p>
                  <p className="text-[10px] text-ink-3">kcal</p>
                </div>
                <ChevronRightIcon width={16} height={16} className={`text-ink-3 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>

              {open && (
                <div className="mt-3 divide-y divide-line border-t border-line pt-2">
                  {MEAL_ORDER.map((m) => {
                    const mealEntries = entries.filter((e) => e.item.meal_type === m);
                    if (mealEntries.length === 0) return null;
                    const mt = mealEntries.reduce(
                      (a, e) => ({ cal: a.cal + e.calories, p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }),
                      { cal: 0, p: 0, c: 0, f: 0 },
                    );
                    return (
                      <div key={m} className="py-2">
                        <p className="mb-1 text-xs font-semibold text-ink-2">
                          {MEAL_LABELS[m]} · {Math.round(mt.cal)} kcal
                        </p>
                        {mealEntries.map((e) => (
                          <div key={e.item.id} className="flex justify-between py-0.5 text-xs">
                            <span className="text-ink">
                              {e.food.name} <span className="text-ink-3">{Math.round(e.item.grams)}g</span>
                            </span>
                            <span className="text-ink-2">
                              P{Math.round(e.protein * 10) / 10} C{Math.round(e.carbs * 10) / 10} F
                              {Math.round(e.fat * 10) / 10}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}

export default function DietHistoryPage() {
  const mounted = useMounted();
  if (!mounted) return <PageContainer title="饮食历史" back />;
  return <DietHistoryDashboard />;
}
