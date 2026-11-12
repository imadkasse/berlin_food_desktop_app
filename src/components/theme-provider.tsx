"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

import { useThemeStore } from "@/stores/theme";

export type ThemeProviderProps = {
  children: ReactNode;
};

/**
 * Applies the `dark` class to `<html>` whenever the theme changes.
 *
 * The initial theme is applied by a blocking inline script in the root
 * layout so there is no flash of the wrong theme before hydration.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme === "dark" ? "dark" : "light";
  }, [theme]);

  return <>{children}</>;
}

export default ThemeProvider;
