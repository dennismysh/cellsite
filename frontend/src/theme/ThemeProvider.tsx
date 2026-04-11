import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "./useThemeStore.js";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const effective =
        mode === "system" ? (media.matches ? "dark" : "light") : mode;
      document.documentElement.setAttribute("data-theme", effective);
    };

    apply();

    if (mode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    return undefined;
  }, [mode]);

  return <>{children}</>;
}
