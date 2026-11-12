"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { IconClose } from "@/components/ui/icons";

export type DialogSize = "sm" | "md" | "lg";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: DialogSize;
};

const SIZE_CLASSES: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
};

/**
 * Modal dialog built on the native `<dialog>` element.
 *
 * Uses `showModal()` so the browser handles the top layer, the backdrop and
 * the inert background for us. Escape closes the dialog, and focus returns to
 * the element that opened it.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
    } else if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      // Escape — let the parent decide what "closed" means.
      event.preventDefault();
      close();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [close]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
      onClose={close}
      className={cn(
        "m-auto w-[calc(100vw-2rem)] rounded-xl bg-surface p-0 text-foreground",
        "border border-line/70 shadow-[0_18px_50px_-12px_rgba(43,33,27,0.35)]",
        "backdrop:bg-[rgba(43,33,27,0.45)]",
        "open:animate-[dialog-in_180ms_ease-out]",
        SIZE_CLASSES[size],
        mounted ? "" : "hidden",
      )}
      style={{ maxHeight: "min(85vh, 48rem)" }}
    >
      <div className="flex max-h-[85vh] flex-col">
        <header className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex flex-col gap-1">
            <h2 id="dialog-title" className="type-headline-sm text-foreground">
              {title}
            </h2>
            {description ? (
              <p id="dialog-description" className="type-body-md text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="إغلاق النافذة"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
              "text-subtle transition-colors hover:bg-surface-secondary hover:text-foreground",
            )}
          >
            <IconClose size={18} />
          </button>
        </header>

        <div className="scrollbar-slim overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line/70 bg-surface-secondary/60 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}

export default Dialog;
