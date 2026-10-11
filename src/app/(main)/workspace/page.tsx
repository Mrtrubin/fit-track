"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllDayEntries,
  getBodyRecords,
  getGoal,
  getLatestBodyRecord,
  getProfile,
  getSessions,
  getTrainingStats,
  seedIfNeeded,
} from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { useDbVersion } from "@/store/dbStore";
import { sumNutrition } from "@/lib/calc/nutrition";
import PageContainer from "@/components/layout/PageContainer";
import { Card, SectionTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

export default function WorkspacePage() {
  useDbVersion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedIfNeeded();
    setReady(true);
  }, []);

  if (!ready) return null;

  const profile = getProfile();
  const goal = getGoal();
  const date = todayStr();
  const totals = sumNutrition(getAllDayEntries(date));
  const latestBody = getLatestBodyRecord();
  const stats = getTrainingStats();
  const sessions = getSessions().slice(0, 5);
  const recentBodies = getBodyRecords().slice(-7);
  const weeklyAvg =
    recentBodies.length > 0
      ? recentBodies.reduce((s, r) => s + (r.weight_kg ?? 0), 0) / recentBodies.length
      : null;

  if (!profile) {
    return (
      <PageContainer title="工作台">
        <Card className="p-6 text-center text-sm text-ink-3">
          请先完成<a href="/setup" className="text-brand underline">初始化</a>后使用工作台
        </Card>
      </PageContainer>
    );
  }

  const calRemain = goal ? Math.max(0, Math.round(goal.target_calories - totals.calories)) : 0;
  const calTotal = goal?.target_calories ?? 1;
  const pct = (n: number, t: number) => Math.min(100, Math.round((n / Math.max(1, t)) * 100));

  return (
    <PageContainer title="工作台">
      {/* 今日热量总览 */}
      <SectionTitle title="今日概览" />
      <Card className="mb-5 p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs text-ink-3">今日摄入 / 目标</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">
              {Math.round(totals.calories)}
              <span className="text-base font-normal text-ink-3"> / {calTotal} kcal</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-3">剩余</p>
            <p className={`mt-1 text-2xl font-bold ${calRemain > 0 ? "text-brand" : "text-danger"}`}>
              {calRemain}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={totals.calories} max={calTotal} />
        </div>

        <div className="mt-5 space-y-3">
          {[
            { label: "蛋白质", v: totals.protein, t: goal?.protein_g ?? 1, color: "bg-blue" },
            { label: "碳水", v: totals.carbs, t: goal?.carbs_g ?? 1, color: "bg-amber" },
            { label: "脂肪", v: totals.fat, t: goal?.fat_g ?? 1, color: "bg-pink" },
          ].map((m) => (
            <div key={m.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-ink-2">{m.label}</span>
                <span className="text-ink-3">
                  {Math.round(m.v)} / {Math.round(m.t)} g
                </span>
              </div>
              <ProgressBar value={m.v} max={m.t} />
            </div>
          ))}
        </div>
      </Card>

      {/* 身体数据 */}
      <SectionTitle title="身体数据" />
      <Card className="mb-5 grid grid-cols-2 gap-3 p-5">
        <div>
          <p className="text-xs text-ink-3">当前体重</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {latestBody ? `${latestBody.weight_kg}` : "--"}
            <span className="text-sm font-normal text-ink-3"> kg</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-3">近 7 日平均</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {weeklyAvg ? `${weeklyAvg.toFixed(1)}` : "--"}
            <span className="text-sm font-normal text-ink-3"> kg</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-3">体脂率</p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {latestBody?.body_fat_pct ? `${latestBody.body_fat_pct}` : "--"}
            <span className="text-sm font-normal text-ink-3"> %</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-3">目标</p>
          <p className="mt-1 text-base font-semibold text-ink">
            {goal?.goal === "fat_loss" ? "减脂" : goal?.goal === "muscle_gain" ? "增肌" : goal?.goal === "maintain" ? "维持" : "身体重组"}
          </p>
        </div>
      </Card>

      {/* 训练统计 */}
      <SectionTitle title="训练统计" />
      <Card className="mb-5 grid grid-cols-3 gap-3 p-5 text-center">
        <div>
          <p className="text-2xl font-bold text-ink">{stats.count}</p>
          <p className="mt-1 text-xs text-ink-3">总训练次数</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{stats.totalSets}</p>
          <p className="mt-1 text-xs text-ink-3">总组数</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-ink">{(stats.totalVolume / 1000).toFixed(1)}k</p>
          <p className="mt-1 text-xs text-ink-3">总吨数</p>
        </div>
      </Card>

      {/* 最近训练 */}
      <SectionTitle title="最近训练" />
      <Card className="mb-5 divide-y divide-line p-2">
        {sessions.length === 0 && (
          <p className="p-4 text-center text-sm text-ink-3">还没有训练记录，去<Link href="/workout" className="text-brand underline">训练页</Link>开始第一次吧</p>
        )}
        {sessions.map((s) => (
          <Link key={s.id} href="/workout/history" className="flex items-center justify-between px-3 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-xs text-ink-3">{s.date}</p>
            </div>
            <span className="text-xs text-ink-3">{s.body_parts}</span>
          </Link>
        ))}
      </Card>

      {/* 快捷入口 */}
      <SectionTitle title="快捷入口" />
      <Card className="mb-5 grid grid-cols-2 gap-2 p-3">
        <Link href="/" className="rounded-xl bg-surface-2 px-3 py-3 text-center text-sm font-semibold text-ink">今日状态</Link>
        <Link href="/diet" className="rounded-xl bg-surface-2 px-3 py-3 text-center text-sm font-semibold text-ink">记饮食</Link>
        <Link href="/workout" className="rounded-xl bg-surface-2 px-3 py-3 text-center text-sm font-semibold text-ink">去训练</Link>
        <Link href="/data" className="rounded-xl bg-surface-2 px-3 py-3 text-center text-sm font-semibold text-ink">看数据</Link>
      </Card>
    </PageContainer>
  );
}
