import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { IconReceipt } from "@/components/ui/icons";

/**
 * «الطلب غير موجود» — the friendly state of a deleted or unknown order.
 *
 * The route never crashes on a missing id: the admin simply gets an
 * explanation and a way back to the list.
 */
export default function OrderNotFound() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <div className="rounded-lg bg-surface">
        <EmptyState
          icon={<IconReceipt size={22} />}
          title="الطلب غير موجود"
          description="ربما تم حذفه أو أن الرابط غير صحيح. عد إلى قائمة الطلبات لاختيار طلب آخر."
          action={
            <Link
              href="/dashboard/orders"
              className="inline-flex h-11 items-center justify-center rounded-md bg-surface-secondary px-4 type-body-md font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              العودة إلى الطلبات
            </Link>
          }
        />
      </div>
    </div>
  );
}
