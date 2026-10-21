import { Suspense } from "react";
import EditPlan from "@/components/EditPlan";
import PageShell from "@/components/PageShell";

async function EditPlanLoader({ params }: Pick<PageProps<"/plans/[id]/edit">, "params">) {
  const { id } = await params;
  return <EditPlan id={id} />;
}

export default function EditPlanPage({ params }: PageProps<"/plans/[id]/edit">) {
  return (
    <PageShell>
      <Suspense fallback={<p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}>
        <EditPlanLoader params={params} />
      </Suspense>
    </PageShell>
  );
}
