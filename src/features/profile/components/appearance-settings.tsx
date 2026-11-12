"use client";

import { IconCheck, IconMoon, IconSun } from "@/components/ui/icons";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/cn";
import type { Theme } from "@/stores/theme";

type ThemeOption = {
  value: Theme;
  label: string;
  description: string;
  icon: typeof IconSun;
  swatch: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
  };
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "فاتح",
    description: "خلفية فاتحة دافئة تُريح العين نهارًا.",
    icon: IconSun,
    swatch: {
      background: "#FAF7F2",
      surface: "#FFFDF9",
      text: "#2B211B",
      muted: "#A3978D",
      primary: "#9F4200",
    },
  },
  {
    value: "dark",
    label: "داكن",
    description: "خلفية داكنة دافئة مريحة في البيئات الإضاءة الخافتة.",
    icon: IconMoon,
    swatch: {
      background: "#1E1915",
      surface: "#29221D",
      text: "#F5EDE5",
      muted: "#8D7E72",
      primary: "#F27121",
    },
  },
];

function ThemePreview({ option }: { option: ThemeOption }) {
  const { background, surface, text, muted, primary } = option.swatch;

  return (
    <div
      aria-hidden="true"
      className="flex h-20 gap-1.5 rounded-md p-2"
      style={{ backgroundColor: background }}
    >
      <span
        className="w-1/3 rounded-sm"
        style={{ backgroundColor: surface }}
      />
      <span className="flex flex-1 flex-col gap-1.5">
        <span
          className="h-2 w-2/3 rounded-sm"
          style={{ backgroundColor: text }}
        />
        <span
          className="h-2 w-1/2 rounded-sm"
          style={{ backgroundColor: muted }}
        />
        <span
          className="mt-auto h-3 w-1/3 rounded-sm"
          style={{ backgroundColor: primary }}
        />
      </span>
    </div>
  );
}

/**
 * Tab 4 — «المظهر».
 *
 * Light / dark choice backed by the shared theme store. The change is applied
 * immediately so the administrator sees the result before leaving the page.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col gap-3 rounded-lg p-4 text-start transition-colors duration-150",
                selected
                  ? "bg-accent-soft ring-1 ring-primary/45"
                  : "bg-surface-secondary hover:bg-surface-hover",
              )}
            >
              <ThemePreview option={option} />

              <span className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Icon size={18} className="text-primary" />
                  <span className="type-label text-foreground">{option.label}</span>
                </span>

                {selected ? (
                  <span className="inline-flex items-center gap-1.5 type-body-sm text-primary">
                    <IconCheck size={15} />
                    مُفعّل
                  </span>
                ) : null}
              </span>

              <span className="type-body-sm text-subtle">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg bg-surface-secondary px-4 py-4">
        <p className="type-body-md text-foreground">
          يُطبَّق المظهر المختار على هذا الجهاز فقط، ولا يؤثر على بقية الأجهزة
          ولا على حسابات المشرفين الأخرى.
        </p>
        <p className="mt-1 type-body-sm text-subtle">
          التغيير يظهر فورًا دون حاجة إلى إعادة تحميل الصفحة.
        </p>
      </div>
    </div>
  );
}

export default AppearanceSettings;
