"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DropdownItem = {
  label: string;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
};

export type DropdownMenuProps = {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  children?: ReactNode;
  className?: string;
};

/**
 * Lightweight menu popover.
 *
 * Closes on outside click and on Escape, and returns focus to the trigger.
 */
export function DropdownMenu({
  trigger,
  items,
  align = "end",
  children,
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="block"
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-2 min-w-[13rem] rounded-lg bg-surface p-1.5",
            "border border-line/80 shadow-[0_12px_32px_-12px_rgba(43,33,27,0.28)]",
            align === "end" ? "end-0" : "start-0",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                setOpen(false);
                item.onSelect?.();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-start",
                "type-body-md transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-50",
                item.danger
                  ? "text-danger hover:bg-danger-soft"
                  : "text-foreground hover:bg-surface-hover",
              )}
            >
              {item.icon ? (
                <span aria-hidden="true" className="shrink-0 text-subtle">
                  {item.icon}
                </span>
              ) : null}
              <span className="truncate">{item.label}</span>
            </button>
          ))}

          {children ? <div className="mt-1 border-t border-line/70 pt-1">{children}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

export default DropdownMenu;
