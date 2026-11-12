import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { IconUsers } from "@/components/ui/icons";

/**
 * «المستخدم غير موجود» — the friendly state of a deleted or unknown account.
 *
 * The route never crashes on a missing id: the admin simply gets an
 * explanation and a way back to the list.
 */
export default function UserNotFound() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <div className="rounded-lg bg-surface">
        <EmptyState
          icon={<IconUsers size={22} />}
          title="هذا الحساب غير موجود"
          description="ربما حُذف الحساب أو تغيّر معرّفه. عد إلى قائمة المستخدمين لاختيار حساب آخر."
          action={
            <Link
              href="/dashboard/users"
              className="inline-flex h-11 items-center justify-center rounded-md bg-surface-secondary px-4 type-body-md font-semibold text-foreground transition-colors hover:bg-surface-hover"
            >
              العودة إلى المستخدمين
            </Link>
          }
        />
      </div>
    </div>
  );
}
