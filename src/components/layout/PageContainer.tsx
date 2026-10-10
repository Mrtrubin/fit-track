"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@/components/layout/icons";

interface Props {
  /** 页面标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 是否显示返回按钮 */
  back?: boolean;
  /** 返回地址（默认 history.back） */
  backHref?: string;
  /** 右上角动作 */
  right?: ReactNode;
  children?: ReactNode;
  /** 底部额外留白（含底栏的页面传 true） */
  withBottomNav?: boolean;
  /** 无背景卡片的分组内容 */
  className?: string;
}

export default function PageContainer({
  title,
  subtitle,
  back,
  backHref,
  right,
  children,
  withBottomNav = true,
  className = "",
}: Props) {
  return (
    <div className="mx-auto max-w-md min-h-full px-4">
      {(title || back || right) && (
        <header className="sticky top-0 z-30 -mx-4 bg-bg/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            {back &&
              (backHref ? (
                <Link href={backHref} className="-ml-1 rounded-lg p-1 text-ink active:bg-surface-2">
                  <ArrowLeftIcon width={22} height={22} />
                </Link>
              ) : (
                <button
                  onClick={() => window.history.back()}
                  className="-ml-1 rounded-lg p-1 text-ink active:bg-surface-2"
                >
                  <ArrowLeftIcon width={22} height={22} />
                </button>
              ))}
            <div className="flex-1 min-w-0">
              {title && <h1 className="truncate text-lg font-bold leading-tight text-ink">{title}</h1>}
              {subtitle && <p className="truncate text-xs text-ink-2">{subtitle}</p>}
            </div>
            {right}
          </div>
        </header>
      )}
      <main className={`pb-32 pt-3 ${withBottomNav ? "" : "pb-10"} ${className}`}>{children}</main>
    </div>
  );
}
