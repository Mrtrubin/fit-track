import PageContainer from "@/components/layout/PageContainer";

/** 过渡占位页（开发中，后续阶段替换为真实功能） */
export default function Placeholder({
  title,
  desc,
  back,
}: {
  title: string;
  desc: string;
  back?: boolean;
}) {
  return (
    <PageContainer title={title} back={back}>
      <div className="mt-16 flex flex-col items-center text-center">
        <div className="mb-3 text-4xl">💪</div>
        <p className="max-w-[240px] text-sm text-ink-2">{desc}</p>
        <p className="mt-2 text-xs text-ink-3">该模块正在开发中</p>
      </div>
    </PageContainer>
  );
}
