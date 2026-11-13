import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/session";
import { THEME_STORAGE_KEY } from "@/stores/theme";

import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Berlin Food — لوحة إدارة المنصة",
  description: "لوحة إدارة منصة Berlin Food للطلبات والتوصيل والقائمة.",
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
};

/**
 * Blocking script that applies the persisted theme before the first paint.
 * Keeps the `dark` class in sync with `localStorage` without a flash.
 */
const themeScript = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var theme="light";if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.theme){theme=parsed.state.theme;}}if(theme==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cairo.variable}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
