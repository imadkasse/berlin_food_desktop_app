"use client";

import { useCallback } from "react";

import { useThemeStore } from "@/stores/theme";
import type { Theme } from "@/stores/theme";

export type UseThemeResult = {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
};

/** Reads and controls the light/dark theme. */
export function useTheme(): UseThemeResult {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const setTheme = useThemeStore((state) => state.setTheme);

  const toggle = useCallback(() => toggleTheme(), [toggleTheme]);

  return { theme, toggle, setTheme };
}

export default useTheme;
