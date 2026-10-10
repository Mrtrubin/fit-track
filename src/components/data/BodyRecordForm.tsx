"use client";

import { useState } from "react";
import { getLatestBodyRecord, saveBodyRecord } from "@/lib/db";
import { todayStr } from "@/lib/db/localStorage";
import { notifyDataChanged } from "@/store/dbStore";
import { Field, NumberInput, PrimaryButton } from "@/components/ui/form";
import { XIcon } from "@/components/layout/icons";

/** 身体数据记录弹层 */
export default function BodyRecordForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const latest = getLatestBodyRecord();
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState<number | "">(latest?.weight_kg ?? "");
  const [bodyFat, setBodyFat] = useState<number | "">(latest?.body_fat_pct ?? "");
  const [waist, setWaist] = useState<number | "">(latest?.waist_cm ?? "");
  const [chest, setChest] = useState<number | "">(latest?.chest_cm ?? "");
  const [hip, setHip] = useState<number | "">(latest?.hip_cm ?? "");
  const [thigh, setThigh] = useState<number | "">(latest?.thigh_cm ?? "");
  const [arm, setArm] = useState<number | "">(latest?.arm_cm ?? "");

  if (!open) return null;

  function handleSave() {
    if (weight === "") return;
    saveBodyRecord({
      date,
      weight_kg: Number(weight),
      body_fat_pct: bodyFat === "" ? null : Number(bodyFat),
      waist_cm: waist === "" ? null : Number(waist),
      chest_cm: chest === "" ? null : Number(chest),
      hip_cm: hip === "" ? null : Number(hip),
      thigh_cm: thigh === "" ? null : Number(thigh),
      arm_cm: arm === "" ? null : Number(arm),
    });
    notifyDataChanged();
    setWeight("");
    setBodyFat("");
    setWaist("");
    setChest("");
    setHip("");
    setThigh("");
    setArm("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg px-4 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-bold text-ink">记录身体数据</p>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-3 active:bg-surface-2">
            <XIcon width={20} height={20} />
          </button>
        </div>

        <Field label="日期" required>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-brand"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="体重" required>
            <NumberInput value={weight} onChange={setWeight} placeholder="80" min={30} max={300} step={0.1} unit="kg" />
          </Field>
          <Field label="体脂率" hint="可选">
            <NumberInput value={bodyFat} onChange={setBodyFat} placeholder="18" min={3} max={60} step={0.1} unit="%" />
          </Field>
          <Field label="腰围" hint="可选">
            <NumberInput value={waist} onChange={setWaist} placeholder="80" min={40} max={200} step={0.1} unit="cm" />
          </Field>
          <Field label="胸围" hint="可选">
            <NumberInput value={chest} onChange={setChest} placeholder="95" min={50} max={200} step={0.1} unit="cm" />
          </Field>
          <Field label="臀围" hint="可选">
            <NumberInput value={hip} onChange={setHip} placeholder="95" min={50} max={200} step={0.1} unit="cm" />
          </Field>
          <Field label="大腿围" hint="可选">
            <NumberInput value={thigh} onChange={setThigh} placeholder="55" min={30} max={150} step={0.1} unit="cm" />
          </Field>
          <Field label="手臂围" hint="可选">
            <NumberInput value={arm} onChange={setArm} placeholder="35" min={15} max={80} step={0.1} unit="cm" />
          </Field>
        </div>

        <PrimaryButton onClick={handleSave} disabled={weight === ""}>
          保存
        </PrimaryButton>
      </div>
    </div>
  );
}
