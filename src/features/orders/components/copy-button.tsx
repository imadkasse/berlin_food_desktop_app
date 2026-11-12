"use client";

import { useState } from "react";

import { IconCheck } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

/**
 * Copy glyph.
 *
 * The shared icon set has no copy symbol, so the two overlapping sheets are
 * drawn here to match the 24×24 / 1.5-stroke geometry of the rest of the set.
 */
function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8.6" y="8.6" width="11.4" height="11.4" rx="2" />
      <path d="M15.4 5.4H6.6a2 2 0 0 0-2 2v8.8" />
    </svg>
  );
}

export type CopyButtonProps = {
  /** The value written to the clipboard. */
  value: string;
  /** Arabic description used in the toast and the accessible label. */
  label: string;
  className?: string;
};

/**
 * Copies a value to the clipboard.
 *
 * The button reports the outcome with a toast, so the admin always knows
 * whether the copy worked — silent failures are a common source of confusion.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.success(`تم نسخ ${label}`);
    } catch {
      toast.error(`تعذّر نسخ ${label}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`نسخ ${label}`}
      title={`نسخ ${label}`}
      className={
        className ??
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-surface-secondary hover:text-foreground"
      }
    >
      {copied ? (
        <IconCheck size={14} className="text-success" />
      ) : (
        <CopyIcon size={14} />
      )}
    </button>
  );
}

export default CopyButton;
