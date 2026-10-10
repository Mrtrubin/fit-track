"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addCustomFood, getFoodById, updateFood } from "@/lib/db";
import { notifyDataChanged } from "@/store/dbStore";
import { FOOD_CATEGORIES } from "@/lib/constants";
import { Field, NumberInput, PrimaryButton, Select, TextInput } from "@/components/ui/form";
import PageContainer from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/Card";

/**
 * 自定义食物表单（新增 / 编辑共用）
 */
export default function FoodForm({ editId }: { editId?: string }) {
  const router = useRouter();
  const existing = editId ? getFoodById(editId) : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [brand, setBrand] = useState(existing?.brand ?? "");
  const [category, setCategory] = useState(existing?.category ?? "其他");
  const [cal, setCal] = useState<number | "">(existing?.calories_per_100g ?? "");
  const [protein, setProtein] = useState<number | "">(existing?.protein_per_100g ?? "");
  const [carbs, setCarbs] = useState<number | "">(existing?.carbs_per_100g ?? "");
  const [fat, setFat] = useState<number | "">(existing?.fat_per_100g ?? "");
  const [fiber, setFiber] = useState<number | "">(existing?.fiber_per_100g ?? "");
  const [serving, setServing] = useState<number | "">(existing?.serving_size ?? 100);

  const valid = name.trim() !== "" && cal !== "" && protein !== "" && carbs !== "" && fat !== "";

  function handleSave() {
    if (!valid) return;
    const data = {
      name: name.trim(),
      category,
      brand: brand.trim() || null,
      calories_per_100g: Number(cal),
      protein_per_100g: Number(protein),
      carbs_per_100g: Number(carbs),
      fat_per_100g: Number(fat),
      fiber_per_100g: fiber === "" ? 0 : Number(fiber),
      serving_size: serving === "" ? 100 : Number(serving),
      source: "用户自定义",
    };
    if (editId) {
      updateFood(editId, data);
    } else {
      addCustomFood(data);
    }
    notifyDataChanged();
    router.push("/diet/foods");
  }

  if (editId && !existing) {
    return (
      <PageContainer title="编辑食物" back>
        <p className="mt-16 text-center text-sm text-ink-2">未找到该食物</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={editId ? "编辑食物" : "添加食物"} back>
      <Card className="mb-5">
        <Field label="食物名称" required>
          <TextInput value={name} onChange={setName} placeholder="例如：鲨鱼菲特鸭腿" />
        </Field>
        <Field label="品牌" hint="可选">
          <TextInput value={brand} onChange={setBrand} placeholder="例如：鲨鱼菲特" />
        </Field>
        <Field label="分类" required>
          <Select
            value={category}
            onChange={setCategory}
            options={FOOD_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </Field>
        <p className="mb-2 text-xs text-ink-3">以下均为「每 100g」的营养数值</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="热量" required>
            <NumberInput value={cal} onChange={setCal} placeholder="133" min={0} max={2000} unit="kcal" />
          </Field>
          <Field label="蛋白质" required>
            <NumberInput value={protein} onChange={setProtein} placeholder="23.3" min={0} max={100} step={0.1} unit="g" />
          </Field>
          <Field label="碳水" required>
            <NumberInput value={carbs} onChange={setCarbs} placeholder="0" min={0} max={100} step={0.1} unit="g" />
          </Field>
          <Field label="脂肪" required>
            <NumberInput value={fat} onChange={setFat} placeholder="4.1" min={0} max={100} step={0.1} unit="g" />
          </Field>
          <Field label="膳食纤维" hint="可选">
            <NumberInput value={fiber} onChange={setFiber} placeholder="0" min={0} max={100} step={0.1} unit="g" />
          </Field>
          <Field label="常用份量" hint="可选">
            <NumberInput value={serving} onChange={setServing} placeholder="100" min={1} max={5000} unit="g" />
          </Field>
        </div>
      </Card>

      <PrimaryButton onClick={handleSave} disabled={!valid}>
        保存
      </PrimaryButton>
    </PageContainer>
  );
}
