import { Suspense } from "react";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <div className="mt-5">
        <Suspense fallback={<p className="text-sm text-black/50 dark:text-white/50">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
