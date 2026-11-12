"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlert } from "@/components/ui/icons";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("خطأ في لوحة التحكم:", error);
  }, [error]);

  return (
    <div className="rounded-lg bg-surface border border-line/70">
      <EmptyState
        icon={<IconAlert size={22} />}
        title="تعذّر تحميل البيانات"
        description="حدث خطأ أثناء جلب بيانات لوحة التحكم. حاول مرة أخرى بعد قليل."
        action={
          <Button variant="secondary" onClick={reset}>
            إعادة المحاولة
          </Button>
        }
      />
    </div>
  );
}
