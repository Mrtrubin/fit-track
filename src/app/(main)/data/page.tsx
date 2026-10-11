"use client";

import { useMemo, useState } from "react";
import { getAllDayEntries, getBodyRecords, getGoal, getSessions, getSessionSets } from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { useDbVersion } from "@/store/dbStore";
import { sumNutrition } from "@/lib/calc/nutrition";
import { analyzeWeight, movingAverage7, weeklyAverages } from "@/lib/calc/weight";
import { useMounted } from "@/lib/utils/useMounted";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import TrendChart from "@/components/data/TrendChart";
import BodyRecordForm from "@/components/data/BodyRecordForm";
import { PlusIcon } from "@/components/layout/icons";

type Range = 7 | 30 | 90 | 0;
const RANGES: { v: Range; label: string }[] = [
  { v: 7, label: "7天" },
  { v: 30, label: "30天" },
  { v: 90, label: "90天" },
  { v: 0, label: "全部" },
];

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayStr(d);
}

function DataDashboard() {
  useDbVersion();
  const [range, setRange] = useState<Range>(30);
  const [formOpen, setFormOpen] = useState(false);

  const records = useMemo(() => getBodyRecords(), []);
  const goal = getGoal();
  const sessions = getSessions();

  const inRange = (date: string) => (range === 0 ? true : date >= daysAgo(range - 1));

  // 概览
  const latest = records.length > 0 ? records[records.length - 1] : null;
  const rec7 = records.filter((r) => r.date >= daysAgo(6));
  const rec30 = records.filter((r) => r.date >= daysAgo(29));
  const avg7 = rec7.length > 0 ? rec7.reduce((s, r) => s + r.weight_kg, 0) / rec7.length : null;
  const avg30 = rec30.length > 0 ? rec30.reduce((s, r) => s + r.weight_kg, 0) / rec30.length : null;

  // 最近7天平均摄入
  const avgIntake = useMemo(() => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const entries = getAllDayEntries(todayStr(d));
      if (entries.length > 0) {
        sum += sumNutrition(entries).calories;
        n += 1;
      }
    }
    return n > 0 ? Math.round(sum / n) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avgProtein = useMemo(() => {
    let sum = 0;
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const entries = getAllDayEntries(todayStr(d));
      if (entries.length > 0) {
        sum += sumNutrition(entries).protein;
        n += 1;
      }
    }
    return n > 0 ? Math.round(sum / n) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 训练统计
  const totalSets = useMemo(() => {
    let n = 0;
    for (const s of sessions) n += getSessionSets(s.id).length;
    return n;
  }, [sessions]);

  // 力量变化（主要动作最佳重量首末对比）
  const strength = useMemo(() => {
    const map = new Map<string, { name: string; first: number; last: number; date: string; best: number }>();
    const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    for (const s of ordered) {
      for (const st of getSessionSets(s.id)) {
        const cur = map.get(st.exercise_id) ?? { name: st.exercise_name, first: 0, last: 0, date: "", best: 0 };
        const bw = Math.max(cur.best, st.weight_kg);
        if (cur.best === 0 || st.weight_kg > cur.best) cur.best = st.weight_kg;
        if (cur.first === 0) cur.first = st.weight_kg;
        cur.last = Math.max(cur.last, st.weight_kg);
        cur.best = bw;
        cur.date = s.date;
        map.set(st.exercise_id, cur);
      }
    }
    return [...map.values()]
      .filter((v) => v.best > 0)
      .map((v) => ({ ...v, diff: v.last - v.first }))
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 3);
  }, [sessions]);

  // 体重分析
  const analysis = analyzeWeight(records, goal?.goal ?? "maintain");
  const trendData = records
    .filter((r) => inRange(r.date))
    .map((r) => ({ date: r.date.slice(5), weight: r.weight_kg }));
  const fatData = records.filter((r) => inRange(r.date) && r.body_fat_pct != null).map((r) => ({ date: r.date.slice(5), bodyfat: r.body_fat_pct as number }));
  const waistData = records.filter((r) => inRange(r.date) && r.waist_cm != null).map((r) => ({ date: r.date.slice(5), waist: r.waist_cm as number }));

  const weekly = weeklyAverages(records);

  return (
    <PageContainer
      title="数据"
      right={
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
        >
          <PlusIcon width={13} height={13} />
          记录
        </button>
      }
    >
      {/* 概览指标 */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        {[
          { label: "当前体重", v: latest ? `${latest.weight_kg}kg` : "--" },
          { label: "7日平均", v: avg7 ? `${Math.round(avg7 * 10) / 10}kg` : "--" },
          { label: "30日平均", v: avg30 ? `${Math.round(avg30 * 10) / 10}kg` : "--" },
          { label: "目标热量", v: goal ? `${goal.target_calories}` : "--" },
          { label: "平均摄入", v: avgIntake ? `${avgIntake}` : "--" },
          { label: "平均蛋白", v: avgProtein ? `${avgProtein}g` : "--" },
          { label: "训练次数", v: `${sessions.length}` },
          { label: "总组数", v: `${totalSets}` },
        ].map((m) => (
          <Card key={m.label} className="p-2.5 text-center">
            <p className="truncate text-[11px] text-ink-3">{m.label}</p>
            <p className="mt-0.5 truncate text-sm font-bold text-ink">{m.v}</p>
          </Card>
        ))}
      </div>

      {/* 体重趋势 */}
      <SectionTitle title="体重趋势" right={
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.v}
              onClick={() => setRange(r.v)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${range === r.v ? "bg-ink text-white" : "bg-surface text-ink-3"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      } />
      <Card className="mb-5">
        {trendData.length >= 2 ? (
          <TrendChart data={trendData} dataKey="weight" unit="kg" color="var(--color-brand)" yDomain={["auto", "auto"]} />
        ) : (
          <p className="py-8 text-center text-sm text-ink-3">至少记录 2 次体重才能显示趋势</p>
        )}
      </Card>

      {/* 体重分析 */}
      {analysis.advice && (
        <Card className={`mb-5 border ${analysis.status === "normal" ? "border-success/30 bg-success/5" : analysis.status === "too_fast" ? "border-warn/30 bg-warn/5" : "border-line"}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">体重分析</p>
            <span className="text-xs text-ink-2">
              周变化：{analysis.weeklyChange !== null ? `${analysis.weeklyChange > 0 ? "+" : ""}${analysis.weeklyChange} kg` : "--"}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{analysis.advice}</p>
          {weekly.length >= 2 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {weekly.slice(-4).map((w) => (
                <span key={w.weekStart} className="rounded-lg bg-surface px-2 py-1 text-[11px] text-ink-2">
                  {w.label} 周均 {w.avgWeight}kg
                </span>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-ink-3">基于 7 日平均体重计算，减少单日水分波动影响</p>
        </Card>
      )}

      {/* 体脂趋势 */}
      {fatData.length >= 2 && (
        <>
          <SectionTitle title="体脂趋势" />
          <Card className="mb-5">
            <TrendChart data={fatData} dataKey="bodyfat" unit="%" color="#eab308" yDomain={["auto", "auto"]} />
          </Card>
        </>
      )}

      {/* 腰围趋势 */}
      {waistData.length >= 2 && (
        <>
          <SectionTitle title="腰围趋势" />
          <Card className="mb-5">
            <TrendChart data={waistData} dataKey="waist" unit="cm" color="#0ea5e9" yDomain={["auto", "auto"]} />
          </Card>
        </>
      )}

      {/* 力量变化 */}
      <SectionTitle title="力量变化" />
      <Card className="mb-5">
        {strength.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-3">开始训练后，这里会展示主要动作的重量变化</p>
        ) : (
          <div className="space-y-2">
            {strength.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                <span className="font-semibold text-ink">{s.name}</span>
                <span className="text-ink-2">
                  {s.first}kg → <span className="font-bold text-brand">{s.last}kg</span>
                  <span className={`ml-1 text-xs ${s.diff >= 0 ? "text-success" : "text-danger"}`}>
                    {s.diff >= 0 ? "+" : ""}{s.diff}kg
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <BodyRecordForm open={formOpen} onClose={() => setFormOpen(false)} />
    </PageContainer>
  );
}

export default function DataPage() {
  const mounted = useMounted();
  if (!mounted) return <PageContainer title="数据" />;
  return <DataDashboard />;
}
