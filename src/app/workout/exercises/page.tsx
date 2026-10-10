"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getExercises } from "@/lib/db";
import { DIFFICULTY_LABELS, EQUIPMENT_LABELS, MUSCLE_CATEGORIES } from "@/lib/constants";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon, SearchIcon } from "@/components/layout/icons";

export default function ExercisesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const exercises = useMemo(() => getExercises(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      const matchCat = !category || e.category === category;
      const matchQ = !q || e.name.toLowerCase().includes(q) || e.primary_muscle.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [exercises, query, category]);

  return (
    <PageContainer title="动作库" back>
      <div className="relative mb-3">
        <SearchIcon width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索动作或目标肌肉"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
        />
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory("")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === "" ? "bg-ink text-white" : "bg-surface text-ink-2"}`}
        >
          全部
        </button>
        {MUSCLE_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(category === c.value ? "" : c.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === c.value ? "bg-ink text-white" : "bg-surface text-ink-2"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <Card className="py-8 text-center text-sm text-ink-3">没有找到相关动作</Card>}
        {filtered.map((e) => (
          <Link key={e.id} href={`/workout/exercises/${e.id}`}>
            <Card className="py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{e.name}</p>
                  <p className="truncate text-[11px] text-ink-3">
                    {e.primary_muscle}
                    {e.secondary_muscle ? ` · ${e.secondary_muscle}` : ""} · {EQUIPMENT_LABELS[e.equipment]} ·{" "}
                    {DIFFICULTY_LABELS[e.difficulty]}
                  </p>
                </div>
                <div className="shrink-0 text-right text-[11px] text-ink-2">
                  <p className="font-bold text-ink">
                    {e.recommended_sets} × {e.recommended_reps}
                  </p>
                  <p>休息 {e.recommended_rest_sec}s</p>
                </div>
                <ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
