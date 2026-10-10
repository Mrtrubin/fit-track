"use client";

import { useEffect, useState } from "react";

/**
 * 客户端挂载标记。
 * 用于需要在渲染中读取「当前时间 / localStorage」的页面：
 * SSR/预渲染阶段返回 false，避免 new Date() 被静态预渲染固定。
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
