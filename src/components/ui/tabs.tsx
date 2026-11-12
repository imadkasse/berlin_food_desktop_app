"use client";

import { cn } from "@/lib/cn";

export type TabItem = {
  value: string;
  label: string;
  count?: number;
};

export type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabItem[];
  className?: string;
  "aria-label"?: string;
};

export function Tabs({
  value,
  onValueChange,
  tabs,
  className,
  ...props
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={props["aria-label"] ?? "أقسام الصفحة"}
      className={cn(
        "scrollbar-slim flex items-center gap-1 overflow-x-auto",
        "rounded-lg bg-surface-secondary p-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2",
              "type-label transition-colors duration-150",
              active
                ? "bg-surface text-primary shadow-[0_1px_2px_rgba(43,33,27,0.06)]"
                : "text-muted hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5",
                  "type-body-sm tabular",
                  active ? "bg-accent-soft text-primary" : "bg-surface text-subtle",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
