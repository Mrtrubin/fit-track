"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { seedIfNeeded } from "@/lib/db";
import { DataIcon, DietIcon, HomeIcon, ProfileIcon, WorkoutIcon } from "@/components/layout/icons";

const TABS = [
  { href: "/", label: "首页", Icon: HomeIcon },
  { href: "/diet", label: "饮食", Icon: DietIcon },
  { href: "/workout", label: "训练", Icon: WorkoutIcon },
  { href: "/data", label: "数据", Icon: DataIcon },
  { href: "/profile", label: "我的", Icon: ProfileIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  // 任意页面挂载时确保内置数据种子就绪（幂等，可重复调用）
  useEffect(() => {
    seedIfNeeded();
  }, []);

  // 全屏训练页不显示底部导航
  if (pathname.startsWith("/workout/session")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-stretch">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon width={23} height={23} className={active ? "text-brand" : "text-ink-3"} />
              <span
                className={`text-[11px] leading-none ${
                  active ? "font-semibold text-brand" : "text-ink-3"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
