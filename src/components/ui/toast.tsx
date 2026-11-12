"use client";

import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import type { ExternalToast, ToasterProps } from "sonner";

import { useThemeStore } from "@/stores/theme";

export type { ToasterProps };

type ToastOptions = Omit<ExternalToast, "description"> & {
  description?: string;
};

/**
 * Thin Arabic-aware wrapper around sonner.
 *
 * Every message passed through this helper is expected to be written in
 * Arabic; the wrapper only guarantees consistent defaults and types.
 */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    sonnerToast.success(message, options),
  error: (message: string, options?: ToastOptions) =>
    sonnerToast.error(message, options),
  warning: (message: string, options?: ToastOptions) =>
    sonnerToast.warning(message, options),
  info: (message: string, options?: ToastOptions) =>
    sonnerToast.info(message, options),
  message: (message: string, options?: ToastOptions) =>
    sonnerToast(message, options),
  loading: (message: string, options?: ToastOptions) =>
    sonnerToast.loading(message, options),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
};

export type { ToastOptions };

export type UseToastResult = {
  success: (message: string, options?: { description?: string }) => void;
  error: (message: string, options?: { description?: string }) => void;
  warning: (message: string, options?: { description?: string }) => void;
  info: (message: string, options?: { description?: string }) => void;
  loading: (message: string, options?: { description?: string }) => void;
  dismiss: (id?: string | number) => void;
};

/**
 * Returns the Arabic toast helpers.
 *
 * `useToast` is a thin, stable wrapper so components never import the toast
 * implementation directly.
 */
export function useToast(): UseToastResult {
  return {
    success: (message, options) => toast.success(message, options),
    error: (message, options) => toast.error(message, options),
    warning: (message, options) => toast.warning(message, options),
    info: (message, options) => toast.info(message, options),
    loading: (message, options) => toast.loading(message, options),
    dismiss: (id) => toast.dismiss(id),
  };
}

/**
 * Arabic-aware toast host.
 *
 * The theme is taken from the app theme store so the toasts follow the
 * light/dark class that the ThemeProvider applies to `<html>`.
 */
export function Toaster() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <SonnerToaster
      dir="rtl"
      position="top-left"
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-line bg-surface text-foreground type-body-md",
          title: "type-label text-foreground",
          description: "type-body-sm text-muted",
        },
      }}
    />
  );
}

export default Toaster;
