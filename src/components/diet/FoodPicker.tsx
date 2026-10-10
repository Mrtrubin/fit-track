"use client";

import { useMemo, useState } from "react";
import { addFoodItem, getFoods, type FoodLogEntry } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import type { Food, MealType } from "@/types";
import { FOOD_CATEGORIES } from "@/lib/constants";
import { SearchIcon, XIcon } from "@/components/layout/icons";
import { NumberInput, PrimaryButton } from "@/components/ui/form";

/**
 * 添加食物弹层：搜索 → 选择食物 → 输入重量 → 自动计算营养 → 加入指定餐次
 */
export default function FoodPicker({
  open,
  onClose,
  date,
  meal,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  meal: MealType;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState<number | "">(100);
  const [added, setAdded] = useState(false);

  const foods = useMemo(() => getFoods(), [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      const matchCat = !category || f.category === category;
      const matchQ =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.brand ?? "").toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [foods, query, category]);

  const preview = useMemo(() => {
    if (!selected || grams === "") return null;
    const k = Number(grams) / 100;
    return {
      calories: Math.round(selected.calories_per_100g * k),
      protein: Math.round(selected.protein_per_100g * k * 10) / 10,
      carbs: Math.round(selected.carbs_per_100g * k * 10) / 10,
      fat: Math.round(selected.fat_per_100g * k * 10) / 10,
    };
  }, [selected, grams]);

  if (!open) return null;

  function handleAdd() {
    if (!selected || grams === "") return;
    addFoodItem(date, meal, selected.id, Number(grams));
    notifyDataChanged();
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelected(null);
      setQuery("");
      setGrams(100);
      onClose();
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg px-4 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />

        {/* 搜索 */}
        <div className="relative mb-3">
          <SearchIcon width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索食物，如：米饭、鸡胸肉"
            className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
            autoFocus
          />
        </div>

        {/* 分类 */}
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory("")}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              category === "" ? "bg-brand text-white" : "bg-surface text-ink-2"
            }`}
          >
            全部
          </button>
          {FOOD_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(category === c ? "" : c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
                category === c ? "bg-brand text-white" : "bg-surface text-ink-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 食物列表 */}
        {!selected ? (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-ink-3">没有找到相关食物</p>
            )}
            {filtered.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3 text-left active:bg-surface-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{f.name}</p>
                  <p className="text-[11px] text-ink-3">
                    {f.category}
                    {f.brand ? ` · ${f.brand}` : ""} · {f.calories_per_100g} kcal/100g
                  </p>
                </div>
                <span className="ml-2 shrink-0 text-xs text-ink-3">
                  P{f.protein_per_100g} C{f.carbs_per_100g} F{f.fat_per_100g}
                </span>
              </button>
            ))}
          </div>
        ) : (
          /* 选中食物：重量输入 + 营养计算 */
          <div>
            <div className="mb-3 flex items-start justify-between rounded-xl bg-surface p-3.5">
              <div>
                <p className="text-sm font-bold text-ink">{selected.name}</p>
                <p className="text-xs text-ink-3">
                  每100g：{selected.calories_per_100g} kcal · 蛋白 {selected.protein_per_100g}g · 碳水{" "}
                  {selected.carbs_per_100g}g · 脂肪 {selected.fat_per_100g}g
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-ink-3 active:bg-surface-2">
                <XIcon width={18} height={18} />
              </button>
            </div>

            <div className="mb-3">
              <label className="mb-1.5 block text-sm font-medium text-ink">重量</label>
              <NumberInput value={grams} onChange={setGrams} unit="g" min={1} max={5000} step={1} />
            </div>

            {preview && (
              <div className="mb-3 grid grid-cols-4 gap-2 text-center">
                {[
                  { label: "热量", v: `${preview.calories}`, unit: "kcal" },
                  { label: "蛋白", v: `${preview.protein}`, unit: "g" },
                  { label: "碳水", v: `${preview.carbs}`, unit: "g" },
                  { label: "脂肪", v: `${preview.fat}`, unit: "g" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-surface px-1 py-2">
                    <p className="text-[10px] text-ink-3">{m.label}</p>
                    <p className="text-sm font-bold text-ink">
                      {m.v}
                      <span className="text-[10px] font-normal text-ink-3"> {m.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            <PrimaryButton onClick={handleAdd} disabled={grams === "" || Number(grams) <= 0}>
              {added ? "已添加 ✓" : "添加到本餐"}
            </PrimaryButton>
            {grams !== "" && Number(grams) > 0 && selected && (
              <p className="mt-2 text-center text-[11px] text-ink-3">
                实际热量 = {selected.calories_per_100g} × {grams} ÷ 100
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** 便于列表显示条目的类型 */
export type { FoodLogEntry };
