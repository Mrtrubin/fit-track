"use client";

import { useSyncExternalStore } from "react";

/**
 * 轻量数据订阅：任何 db 写操作后调用 notifyDataChanged()，
 * 订阅了 useDbVersion 的组件会自动重渲染，重新读取数据。
 */

let version = 0;
const listeners = new Set<() => void>();

export function notifyDataChanged(): void {
  version += 1;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getVersion(): number {
  return version;
}

/** 页面数据订阅钩子 */
export function useDbVersion(): number {
  return useSyncExternalStore(subscribe, getVersion, getVersion);
}
