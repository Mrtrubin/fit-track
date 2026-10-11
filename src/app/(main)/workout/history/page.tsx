"use client";

import { useMemo, useState } from "react";
import { getSessionSets, getSessions } from "@/lib/db";
import { useDbVersion } from "@/store/dbStore";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { ChevronRightIcon } from "@/components/layout/icons";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  return `${y}年${Number(m)}月${Number(day)}日`;
}

export default function WorkoutHistoryPage() {
  useDbVersion();
  const [openId, setOpenId] = useState<string | null>(null);
  const sessions = useMemo(() => getSessions(), []);

  return (
    <PageContainer title="训练历史" back>
      {sessions.length === 0 && (
        <Card className="py-10 text-center text-sm text-ink-3">还没有训练记录，去开始你的第一次训练吧</Card>
      )}

      <div className="space-y-3">
        {sessions.map((s) => {
          const sets = getSessionSets(s.id);
          const open = openId === s.id;
          const totalSets = sets.length;
          const byEx: Record<string, typeof sets> = {};
          for (const st of sets) {
            (byEx[st.exercise_name] ??= []).push(st);
          }

          return (
            <Card key={s.id} className="py-3">
              <button onClick={() => setOpenId(open ? null : s.id)} className="flex w-full items-center gap-3 text-left">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{fmtDate(s.date)}</p>
                  <p className="truncate text-[11px] text-ink-3">
                    {s.title} · {s.body_parts}
                    {s.duration_min ? ` · ${s.duration_min} 分钟` : ""} · {totalSets} 组
                  </p>
                </div>
                <ChevronRightIcon width={16} height={16} className={`text-ink-3 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  {Object.entries(byEx).map(([name, rows]) => (
                    <div key={name}>
                      <p className="mb-1 text-xs font-bold text-ink">{name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rows.map((r) => (
                          <span key={r.id} className="rounded-lg bg-surface-2 px-2 py-1 text-[11px] text-ink-2">
                            {r.weight_kg}kg × {r.reps}
                            {r.rpe != null && ` · RPE${r.rpe}`}
                            {r.rir != null && ` · RIR${r.rir}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
