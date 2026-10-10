"use client";

import { Suspense } from "react";
import SessionTracker from "@/components/workout/SessionTracker";
import PageContainer from "@/components/layout/PageContainer";

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="开始训练" back withBottomNav={false}>
          <p className="mt-16 text-center text-sm text-ink-3">加载中…</p>
        </PageContainer>
      }
    >
      <SessionTracker />
    </Suspense>
  );
}
