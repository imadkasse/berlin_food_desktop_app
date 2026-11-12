import { cn } from "@/lib/cn";
import { IconClose, IconSearch } from "@/components/ui/icons";

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  autoFocus?: boolean;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "ابحث…",
  className,
  autoFocus,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-subtle"
      >
        <IconSearch size={18} />
      </span>

      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={props["aria-label"] ?? placeholder}
        className={cn(
          "h-11 w-full rounded-md bg-surface-secondary ps-10 pe-9 text-body-md text-foreground",
          "border border-transparent placeholder:text-subtle",
          "transition-colors duration-150",
          "focus:border-accent focus:bg-surface focus:outline-none",
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="مسح البحث"
          className={cn(
            "absolute inset-y-0 end-2 my-auto flex h-7 w-7 items-center justify-center",
            "rounded-full text-subtle transition-colors",
            "hover:bg-surface hover:text-foreground",
          )}
        >
          <IconClose size={16} />
        </button>
      ) : null}
    </div>
  );
}

export default SearchInput;
