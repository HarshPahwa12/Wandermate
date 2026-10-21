import PageShell from "@/components/PageShell";
import PlanForm from "@/components/PlanForm";

export default function NewPlanPage() {
  return (
    <PageShell>
      <PlanForm mode="create" />
    </PageShell>
  );
}
