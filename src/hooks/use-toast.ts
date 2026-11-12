"use client";

/**
 * Re-export of the Arabic toast helpers.
 *
 * `useToast()` returns `{ success, error, warning, info, loading, dismiss }`.
 */
export {
  toast,
  useToast,
  Toaster,
} from "@/components/ui/toast";

export type { ToastOptions, UseToastResult } from "@/components/ui/toast";
