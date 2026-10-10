"use client";

import { removeFoodItem, type FoodLogEntry } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";

/**
 * 单餐区块：条目列表 + 小计 + 添加按钮
 */
export default function MealSection({
  label,
  entries,
  onAdd,
}: {
  label: string;
  entries: FoodLogEntry[];
  onAdd: () => void;
}) {
  const totals = entries.reduce(
    (acc, e) => ({
      cal: acc.cal + e.calories,
      p: acc.p + e.protein,
      c: acc.c + e.carbs,
      f: acc.f + e.fat,
    }),
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  return (
    <div className="mb-4 rounded-2xl border border-line bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{label}</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand active:opacity-80"
        >
          <PlusIcon width={13} height={13} />
          添加食物
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="py-2 text-xs text-ink-3">还没有记录</p>
      ) : (
        <div className="divide-y divide-line">
          {entries.map((e) => (
            <div key={e.item.id} className="group flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{e.food.name}</p>
                <p className="text-[11px] text-ink-3">{Math.round(e.item.grams)}g</p>
              </div>
              <div className="text-right text-xs text-ink-2">
                <p className="font-semibold text-ink">{Math.round(e.calories)} kcal</p>
                <p className="text-[10px]">
                  P{Math.round(e.protein * 10) / 10} C{Math.round(e.carbs * 10) / 10} F
                  {Math.round(e.fat * 10) / 10}
                </p>
              </div>
              <button
                onClick={() => {
                  removeFoodItem(e.item.id);
                  notifyDataChanged();
                }}
                className="rounded-lg p-1.5 text-ink-3 active:bg-danger/10 active:text-danger"
              >
                <TrashIcon width={16} height={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {entries.length > 0 && (
        <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-xs">
          <span className="text-ink-3">本餐小计</span>
          <span className="font-semibold text-ink">
            {Math.round(totals.cal)} kcal · P{Math.round(totals.p)} C{Math.round(totals.c)} F{Math.round(totals.f)}
          </span>
        </div>
      )}
    </div>
  );
}
