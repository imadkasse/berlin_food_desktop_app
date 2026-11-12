"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { setUserAvailabilityAction } from "@/features/users/actions";

export type UserAvailabilityToggleProps = {
  id: string;
  /** The current availability flag of the account. */
  available: boolean;
  /** `true` when the administrator may change the availability. */
  canWrite: boolean;
};

/**
 * «حالة التوفّر» — flips the availability of a delivery account.
 *
 * The write is authorised again on the server (`users.write`), so the switch
 * is only an affordance.
 */
export function UserAvailabilityToggle({
  id,
  available,
  canWrite,
}: UserAvailabilityToggleProps) {
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(available);

  const handleChange = (next: boolean) => {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const result = await setUserAvailabilityAction({ id, available: next });

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      setValue(previous);
      toast.error(result.error);
    });
  };

  return (
    <Switch
      checked={value}
      onCheckedChange={handleChange}
      disabled={!canWrite || isPending}
      label="الحساب نشط"
      description={
        canWrite
          ? "الحسابات غير النشطة لا تظهر في قوائم التوصيل النشطة."
          : "لا تملك صلاحية تغيير حالة التوفّر."
      }
    />
  );
}

export default UserAvailabilityToggle;
