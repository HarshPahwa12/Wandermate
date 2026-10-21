import { Suspense } from "react";
import ConversationPage from "@/components/ConversationPage";
import PageShell from "@/components/PageShell";

async function Loader({ params }: Pick<PageProps<"/messages/[id]">, "params">) {
  const { id } = await params;
  return <ConversationPage id={id} />;
}

export default function MessagePage({ params }: PageProps<"/messages/[id]">) {
  return (
    <PageShell>
      <Suspense fallback={<p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}>
        <Loader params={params} />
      </Suspense>
    </PageShell>
  );
}
