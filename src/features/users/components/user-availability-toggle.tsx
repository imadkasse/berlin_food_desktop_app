"use client";

import { useEffect, useState, useTransition } from "react";

import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { setUserAvailability } from "@/features/users/mutations";

export type UserAvailabilityToggleProps = {
  id: string;
  /** The current availability flag of the account. */
  available: boolean;
  /** `true` when the administrator may change the availability. */
  canWrite: boolean;
  /** Called after the flag was written successfully. */
  onChanged?: () => void | Promise<void>;
};

/**
 * «حالة التوفّر» — flips the availability of a delivery account.
 *
 * The write goes through the browser SDK onto
 * `profiles.availability_status`; RLS decides whether the signed-in
 * administrator may touch the row, so the switch is only an affordance.
 */
export function UserAvailabilityToggle({
  id,
  available,
  canWrite,
  onChanged,
}: UserAvailabilityToggleProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(available);

  // Follow the refreshed row after the drawer (or the list) reloads.
  useEffect(() => {
    setValue(available);
  }, [available]);

  const handleChange = (next: boolean) => {
    const previous = value;
    setValue(next);

    startTransition(async () => {
      const result = await setUserAvailability({ id, available: next });

      if (result.ok) {
        toast.success(result.message);
        // Keep the local switch in sync with the refreshed row.
        setValue(next);
        await onChanged?.();
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
