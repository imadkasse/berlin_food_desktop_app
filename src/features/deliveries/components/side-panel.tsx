"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { IconClose } from "@/components/ui/icons";

export type SidePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/**
 * Right-side detail panel (a drawer, not a centred modal).
 *
 * The panel is anchored to the inline start edge, which is the **right** side
 * of the screen in the RTL layout of the dashboard. Escape closes it, the
 * backdrop closes it and the focus returns to the trigger when it closes.
 */
export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const [entered, setEntered] = useState(false);

  // Keep the latest callback in a ref so the panel is not re-mounted (and the
  // focus is not stolen) whenever the parent re-renders.
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = window.requestAnimationFrame(() => {
      setEntered(true);
      panelRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onOpenChangeRef.current(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-[rgba(43,33,27,0.45)] transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="side-panel-title"
        aria-describedby={description ? "side-panel-description" : undefined}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 start-0 flex w-full max-w-xl flex-col bg-surface text-foreground outline-none",
          "shadow-[0_18px_50px_-12px_rgba(43,33,27,0.35)]",
          "transition-transform duration-200 ease-out",
          // The panel lives on the right edge (inline start in RTL), so it
          // slides in from the right.
          entered ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line/70 px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id="side-panel-title" className="type-headline-sm text-foreground">
              {title}
            </h2>
            {description ? (
              <p id="side-panel-description" className="type-body-md text-muted">
                {description}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="إغلاق اللوحة"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <IconClose size={18} />
          </button>
        </header>

        <div className="scrollbar-slim flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line/70 bg-surface-secondary/60 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default SidePanel;
