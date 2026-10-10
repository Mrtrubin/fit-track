import type { ReactNode } from "react";

/** 卡片容器 */
export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        onClick ? "cursor-pointer active:bg-surface-2" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** 区块标题 */
export function SectionTitle({
  title,
  right,
  className = "",
}: {
  title: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-2 flex items-center justify-between ${className}`}>
      <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      {right}
    </div>
  );
}

/** 无卡片样式容器 */
export function Section({ title, right, children, className = "" }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-5 ${className}`}>
      {title && <SectionTitle title={title} right={right} />}
      {children}
    </section>
  );
}
