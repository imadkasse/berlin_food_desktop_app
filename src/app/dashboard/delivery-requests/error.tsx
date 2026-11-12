"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { IconAlert, IconRefresh } from "@/components/ui/icons";

export default function DeliveryRequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The technical details (SQL / PostgREST messages) stay in the server log —
  // they are never rendered to the administrator.
  useEffect(() => {
    console.error("خطأ في صفحة طلبات التوصيل:", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="flex flex-col items-center gap-4 rounded-lg bg-surface px-6 py-16 text-center"
    >
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger"
      >
        <IconAlert size={22} />
      </span>

      <div className="flex flex-col gap-1">
        <p className="type-headline-sm text-foreground">
          تعذّر تحميل طلبات التوصيل
        </p>
        <p className="type-body-md max-w-md text-muted">
          حدث خطأ غير متوقع أثناء جلب الطلبات. أعد المحاولة، وإذا تكرّر الخطأ
          فتواصل مع مدير النظام.
        </p>
      </div>

      <Button variant="primary" icon={<IconRefresh size={16} />} onClick={reset}>
        إعادة المحاولة
      </Button>
    </div>
  );
}
