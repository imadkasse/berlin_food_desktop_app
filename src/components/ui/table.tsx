import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export type TableProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

/**
 * Scrollable table surface.
 *
 * Renders a real `<table>` element inside a horizontal scroll wrapper so the
 * markup stays semantic and the table fills the available width.
 */
export function Table({ className, children, ...props }: TableProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-lg bg-surface",
        "border border-line/70",
        className,
      )}
      {...props}
    >
      <table className="w-full border-collapse text-start">{children}</table>
    </div>
  );
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-surface-secondary text-muted", className)}
      {...props}
    />
  );
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-line/70", className)} {...props} />;
}

export type TableRowProps = HTMLAttributes<HTMLTableRowElement> & {
  onClick?: () => void;
  "data-state"?: string;
};

export function TableRow({
  className,
  onClick,
  "data-state": dataState,
  ...props
}: TableRowProps) {
  const interactive = typeof onClick === "function";

  return (
    <tr
      onClick={onClick}
      data-state={dataState}
      className={cn(
        "transition-colors duration-150",
        interactive
          ? "cursor-pointer hover:bg-surface-hover focus-visible:bg-surface-hover"
          : "hover:bg-surface-hover/60",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "type-label whitespace-nowrap px-4 py-3 text-start text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-body-md align-middle text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableFooter({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("bg-surface-secondary/70 text-muted", className)}
      {...props}
    />
  );
}

export default Table;
