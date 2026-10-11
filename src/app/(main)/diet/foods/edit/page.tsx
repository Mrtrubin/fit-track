"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import FoodForm from "@/components/diet/FoodForm";
import PageContainer from "@/components/layout/PageContainer";

function EditFoodInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? undefined;
  return <FoodForm editId={id} />;
}

export default function EditFoodPage() {
  return (
    <Suspense
      fallback={
        <PageContainer title="编辑食物" back>
          <p className="mt-16 text-center text-sm text-ink-3">加载中…</p>
        </PageContainer>
      }
    >
      <EditFoodInner />
    </Suspense>
  );
}
