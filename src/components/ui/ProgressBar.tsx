"use client";

/**
 * 进度条（热量/营养目标进度）
 * 可传入超出态（>100% 变红/警示）
 */
export default function ProgressBar({
  value,
  max,
  color = "var(--color-brand)",
  height = 8,
  label,
}: {
  value: number;
  max: number;
  color?: string;
  height?: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  const track = over ? "var(--color-warn)" : color;

  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: track }}
        />
      </div>
      {label && (
        <div className="mt-1 flex justify-between text-[11px] text-ink-3">
          <span>{label}</span>
          <span>{over ? "已超目标" : `${Math.round(pct)}%`}</span>
        </div>
      )}
    </div>
  );
}
