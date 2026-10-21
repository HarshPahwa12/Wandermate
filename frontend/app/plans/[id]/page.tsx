import { Suspense } from "react";
import PageShell from "@/components/PageShell";
import PlanDetail from "@/components/PlanDetail";

async function PlanLoader({ params }: Pick<PageProps<"/plans/[id]">, "params">) {
  const { id } = await params;
  return <PlanDetail id={id} />;
}

export default function PlanPage({ params }: PageProps<"/plans/[id]">) {
  return (
    <PageShell>
      <Suspense fallback={<p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}>
        <PlanLoader params={params} />
      </Suspense>
    </PageShell>
  );
}
