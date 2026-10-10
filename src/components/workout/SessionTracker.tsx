"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getExerciseById,
  getExercises,
  getLastExerciseLogs,
  getPlanById,
  getPlanExercises,
  saveWorkoutSession,
} from "@/lib/db";
import { genId } from "@/lib/db/localStorage";
import { notifyDataChanged } from "@/store/dbStore";
import { getProgressionAdvice } from "@/lib/calc/progression";
import { MUSCLE_LABELS } from "@/lib/constants";
import type { Exercise } from "@/types";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";
import { PrimaryButton } from "@/components/ui/form";
import { PlusIcon, SearchIcon, TrashIcon, XIcon } from "@/components/layout/icons";

interface SetRow {
  key: string;
  weight: string;
  reps: string;
  rpe: string;
  rir: string;
}

interface ExState {
  exerciseId: string;
  name: string;
  primary: string;
  targetSets: number;
  targetReps: string;
  restSec: number;
  sets: SetRow[];
}

function newSet(): SetRow {
  return { key: genId("s"), weight: "", reps: "", rpe: "", rir: "" };
}

function newExState(ex: Exercise, targetSets: number, targetReps: string, restSec: number): ExState {
  return {
    exerciseId: ex.id,
    name: ex.name,
    primary: ex.primary_muscle,
    targetSets,
    targetReps,
    restSec,
    sets: Array.from({ length: targetSets }, () => newSet()),
  };
}

export default function SessionTracker() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("planId");
  const day = params.get("day");

  const [exStates, setExStates] = useState<ExState[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedTitle, setSavedTitle] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exQuery, setExQuery] = useState("");

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  const plan = planId ? getPlanById(planId) : undefined;
  const title = plan ? plan.name : "自由训练";

  useEffect(() => {
    if (planId && day) {
      const items = getPlanExercises(planId).filter((i) => i.day === Number(day));
      const states: ExState[] = items.map((i) => {
        const ex = getExerciseById(i.exercise_id);
        if (!ex) return null;
        return newExState(ex, i.sets, i.reps, i.rest_sec);
      }).filter((s): s is ExState => s !== null);
      if (states.length > 0) setExStates(states);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, day]);

  const exercisePool = useMemo(() => getExercises(), []);

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetRow>) {
    setExStates((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? { ...e, sets: e.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : e,
      ),
    );
  }

  function addSet(exIdx: number) {
    setExStates((prev) => prev.map((e, i) => (i === exIdx ? { ...e, sets: [...e.sets, newSet()] } : e)));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExStates((prev) =>
      prev.map((e, i) => (i === exIdx ? { ...e, sets: e.sets.filter((_, j) => j !== setIdx) } : e)),
    );
  }

  function addExercise(ex: Exercise) {
    setExStates((prev) => [
      ...prev,
      newExState(ex, ex.recommended_sets, ex.recommended_reps, ex.recommended_rest_sec),
    ]);
    setPickerOpen(false);
    setExQuery("");
  }

  /** 一键填入上次记录的重量（次数留空时也补上次次数） */
  function applyLastWeights(exIdx: number, rows: { weight: number; reps: number }[]) {
    setExStates((prev) =>
      prev.map((e, i) =>
        i === exIdx
          ? {
              ...e,
              sets: e.sets.map((s, j) => {
                const row = rows[j];
                if (!row) return s;
                return {
                  ...s,
                  weight: String(row.weight),
                  reps: s.reps !== "" ? s.reps : String(row.reps),
                };
              }),
            }
          : e,
      ),
    );
  }

  /** 有效组（有重量且有次数） */
  function validSets(e: ExState) {
    return e.sets.filter((s) => s.weight !== "" && s.reps !== "");
  }

  function handleFinish() {
    const rows = exStates.flatMap((e) =>
      validSets(e).map((s, i) => ({
        exercise_id: e.exerciseId,
        exercise_name: e.name,
        set_number: i + 1,
        weight_kg: Number(s.weight),
        reps: Number(s.reps),
        rpe: s.rpe === "" ? null : Number(s.rpe),
        rir: s.rir === "" ? null : Number(s.rir),
        target_sets: e.targetSets,
        target_reps: e.targetReps,
      })),
    );
    const durationMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const bodyParts = [...new Set(exStates.map((e) => e.primary))].join("、");
    saveWorkoutSession({
      title,
      body_parts: bodyParts || "自由训练",
      duration_min: durationMin,
      notes: null,
      setRows: rows,
    });
    notifyDataChanged();
    setSavedTitle(title);
    setSaved(true);
  }

  /* ===== 完成页 ===== */
  if (saved) {
    return (
      <PageContainer withBottomNav={false} className="pt-16">
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-ink">训练已保存</h1>
          <p className="mt-1 text-sm text-ink-2">{savedTitle}</p>
          <div className="mt-6 flex w-full max-w-[260px] flex-col gap-3">
            <PrimaryButton onClick={() => router.push("/workout/history")}>查看训练记录</PrimaryButton>
            <button
              onClick={() => router.push("/")}
              className="w-full rounded-xl border border-line bg-surface py-3 text-[15px] font-semibold text-ink"
            >
              返回首页
            </button>
          </div>
        </div>
      </PageContainer>
    );
  }

  const filteredEx = exercisePool.filter((e) => {
    const q = exQuery.trim().toLowerCase();
    return !q || e.name.toLowerCase().includes(q);
  });

  return (
    <PageContainer title="开始训练" subtitle={title} back withBottomNav={false}>
      {/* 动作列表 */}
      <div className="space-y-4">
        {exStates.length === 0 && (
          <Card className="py-10 text-center text-sm text-ink-3">
            还没有训练动作，点击下方按钮从动作库添加
          </Card>
        )}

        {exStates.map((e, ei) => {
          const completed = validSets(e);
          const advice =
            completed.length >= 1
              ? getProgressionAdvice(e.targetReps, completed.map((s) => ({ reps: Number(s.reps), rir: s.rir === "" ? null : Number(s.rir), weight_kg: Number(s.weight) })), getExerciseById(e.exerciseId)?.equipment ?? "machine")
              : null;

          return (
            <Card key={e.exerciseId}>
              {/* 动作头 */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-ink">{e.name}</p>
                  <p className="text-[11px] text-ink-3">
                    {e.primary} · 目标 {e.targetSets} 组 × {e.targetReps} · 休息 {e.restSec}s
                  </p>
                </div>
                <button
                  onClick={() => setExStates((prev) => prev.filter((_, i) => i !== ei))}
                  className="rounded-lg p-1.5 text-ink-3 active:bg-danger/10 active:text-danger"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>

              {/* 上次记录 + 一键填入 */}
              <LastLogs exerciseId={e.exerciseId} onFill={(rows) => applyLastWeights(ei, rows)} />

              {/* 表头 */}
              <div className="mb-1 grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr_2rem] items-center gap-1 text-[10px] text-ink-3">
                <span>组</span>
                <span>重量 kg</span>
                <span>次数</span>
                <span>RPE</span>
                <span>RIR</span>
                <span />
              </div>

              {/* 组输入 */}
              <div className="space-y-1.5">
                {e.sets.map((s, si) => (
                  <div key={s.key} className="grid grid-cols-[2.2rem_1fr_1fr_1fr_1fr_2rem] items-center gap-1">
                    <span className="text-center text-xs font-bold text-ink-2">{si + 1}</span>
                    <input
                      value={s.weight}
                      onChange={(ev) => updateSet(ei, si, { weight: ev.target.value })}
                      inputMode="decimal"
                      placeholder="0"
                      className="w-full rounded-lg border border-line bg-surface-2 px-1.5 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
                    />
                    <input
                      value={s.reps}
                      onChange={(ev) => updateSet(ei, si, { reps: ev.target.value })}
                      inputMode="numeric"
                      placeholder="0"
                      className="w-full rounded-lg border border-line bg-surface-2 px-1.5 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
                    />
                    <input
                      value={s.rpe}
                      onChange={(ev) => updateSet(ei, si, { rpe: ev.target.value })}
                      inputMode="decimal"
                      placeholder="-"
                      className="w-full rounded-lg border border-line bg-surface-2 px-1.5 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
                    />
                    <input
                      value={s.rir}
                      onChange={(ev) => updateSet(ei, si, { rir: ev.target.value })}
                      inputMode="decimal"
                      placeholder="-"
                      className="w-full rounded-lg border border-line bg-surface-2 px-1.5 py-1.5 text-center text-sm text-ink outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => removeSet(ei, si)}
                      className="flex items-center justify-center text-ink-3 active:text-danger"
                    >
                      <XIcon width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button onClick={() => addSet(ei)} className="flex items-center gap-1 text-xs font-semibold text-brand">
                  <PlusIcon width={13} height={13} />
                  加一组
                </button>
                {advice && (
                  <span
                    className={`text-[11px] ${advice.type === "increase" ? "text-success" : advice.type === "maintain" ? "text-ink-3" : "text-warn"}`}
                  >
                    {advice.message}
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* 操作区 */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setPickerOpen(true)}
          className="rounded-xl border border-line bg-surface px-4 py-3.5 text-sm font-semibold text-ink active:bg-surface-2"
        >
          + 添加动作
        </button>
        <div className="flex-1">
          <PrimaryButton onClick={handleFinish} disabled={exStates.every((e) => validSets(e).length === 0)}>
            完成训练
          </PrimaryButton>
        </div>
      </div>

      {/* 动作选择弹层 */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setPickerOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg px-4 pb-8 pt-4" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
            <div className="relative mb-3">
              <SearchIcon width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                value={exQuery}
                onChange={(e) => setExQuery(e.target.value)}
                placeholder="搜索动作"
                className="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-[15px] text-ink outline-none placeholder:text-ink-3 focus:border-brand"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              {filteredEx.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-3 text-left active:bg-surface-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{ex.name}</p>
                    <p className="text-[11px] text-ink-3">
                      {MUSCLE_LABELS[ex.category]} · {ex.primary_muscle}
                    </p>
                  </div>
                  <span className="text-xs text-ink-3">
                    {ex.recommended_sets}×{ex.recommended_reps}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

/** 上次训练记录 + 一键填入 */
function LastLogs({ exerciseId, onFill }: { exerciseId: string; onFill: (rows: { weight: number; reps: number }[]) => void }) {
  const logs = getLastExerciseLogs(getCurrentUid(), exerciseId);
  if (!logs) return null;
  const rows = logs.map((s) => ({ weight: s.weight_kg, reps: s.reps }));
  return (
    <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-brand-soft px-2.5 py-1.5 text-[11px] text-ink-2">
      <span className="min-w-0 truncate">
        上次：{rows.map((r) => `${r.weight}kg × ${r.reps}`).join("  ")}
      </span>
      <button
        onClick={() => onFill(rows)}
        className="shrink-0 rounded-md bg-brand px-2 py-1 text-[11px] font-bold text-white active:opacity-90"
      >
        填入上次重量
      </button>
    </div>
  );
}

function getCurrentUid(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("fittrack:current_user_id") ?? "";
}
