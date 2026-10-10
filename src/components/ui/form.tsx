"use client";

import type { ReactNode } from "react";

/* ========== 标签字段容器 ========== */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-ink">
        {label}
        {required && <span className="text-brand">*</span>}
        {hint && <span className="ml-1 text-xs font-normal text-ink-3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/* ========== 数字输入 ========== */
export function NumberInput({
  value,
  onChange,
  placeholder,
  unit,
  min,
  max,
  step,
  className = "",
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : Number(v));
        }}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-brand"
      />
      {unit && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-3">{unit}</span>}
    </div>
  );
}

/* ========== 文本输入 ========== */
export function TextInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-ink-3 focus:border-brand ${className}`}
    />
  );
}

/* ========== 下拉选择 ========== */
export function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; desc?: string }[];
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-brand"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-ink-3">▼</span>
    </div>
  );
}

/* ========== 分段选择器（单选卡片组） ========== */
export function Segmented({
  options,
  value,
  onChange,
  cols = 2,
}: {
  options: { value: string; label: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border px-3 py-2.5 text-left transition ${
              active
                ? "border-brand bg-brand-soft"
                : "border-line bg-surface active:bg-surface-2"
            }`}
          >
            <span className={`block text-sm font-semibold ${active ? "text-brand" : "text-ink"}`}>
              {o.label}
            </span>
            {o.desc && <span className="mt-0.5 block text-[11px] leading-tight text-ink-3">{o.desc}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ========== 主按钮 ========== */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-xl bg-brand py-3.5 text-[15px] font-bold text-white shadow-lg shadow-brand/25 transition active:opacity-90 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/* ========== 次级按钮 ========== */
export function SecondaryButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-line bg-surface py-3 text-[15px] font-semibold text-ink transition active:bg-surface-2 ${className}`}
    >
      {children}
    </button>
  );
}
