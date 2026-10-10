"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteFood, getFoods } from "@/lib/db";
import { notifyDataChanged, useDbVersion } from "@/store/dbStore";
import { FOOD_CATEGORIES } from "@/lib/constants";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/layout/icons";

export default function FoodsPage() {
  useDbVersion();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");

  const foods = useMemo(() => getFoods(), []);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      const matchTab = tab === "mine" ? f.is_custom : true;
      const matchCat = !category || f.category === category;
      const matchQ =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.brand ?? "").toLowerCase().includes(q);
      return matchTab && matchCat && matchQ;
    });
  }, [foods, query, category, tab]);

  const mineCount = foods.filter((f) => f.is_custom).length;

  return (
    <PageContainer
      title="食物库"
      back
      right={
        <Link href="/diet/foods/add" className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white">
          <PlusIcon width={13} height={13} />
          添加
        </Link>
      }
    >
      {/* 搜索 */}
      <div className="relative mb-3">
        <SearchIcon width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索食物名称或品牌"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
        />
      </div>

      {/* Tab */}
      <div className="mb-3 flex gap-2">
        {[
          { v: "all" as const, label: "全部食物" },
          { v: "mine" as const, label: `我的食物 (${mineCount})` },
        ].map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === t.v ? "bg-brand text-white" : "bg-surface text-ink-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 分类 */}
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory("")}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === "" ? "bg-ink text-white" : "bg-surface text-ink-2"}`}
        >
          全部
        </button>
        {FOOD_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(category === c ? "" : c)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${category === c ? "bg-ink text-white" : "bg-surface text-ink-2"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 列表 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card className="py-8 text-center text-sm text-ink-3">没有找到相关食物</Card>
        )}
        {filtered.map((f) => (
          <Card key={f.id} className="py-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink">
                  {f.name}
                  {f.is_custom && (
                    <span className="shrink-0 rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">自定义</span>
                  )}
                </p>
                <p className="truncate text-[11px] text-ink-3">
                  {f.category}
                  {f.brand ? ` · ${f.brand}` : ""} · {f.source}
                </p>
              </div>
              <div className="shrink-0 text-right text-[11px] leading-4 text-ink-2">
                <p>
                  <span className="font-bold text-ink">{f.calories_per_100g}</span> kcal/100g
                </p>
                <p>
                  P{f.protein_per_100g} C{f.carbs_per_100g} F{f.fat_per_100g}
                </p>
              </div>
              {f.is_custom && (
                <div className="flex shrink-0 flex-col gap-1">
                  <Link
                    href={`/diet/foods/edit?id=${f.id}`}
                    className="rounded-lg p-1.5 text-ink-3 active:bg-surface-2"
                  >
                    <EditIcon width={15} height={15} />
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm(`删除「${f.name}」？`)) {
                        deleteFood(f.id);
                        notifyDataChanged();
                      }
                    }}
                    className="rounded-lg p-1.5 text-ink-3 active:bg-danger/10 active:text-danger"
                  >
                    <TrashIcon width={15} height={15} />
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
