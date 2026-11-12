import { cn } from "@/lib/cn";

export type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-surface-secondary",
        className,
      )}
    />
  );
}

export default Skeleton;
