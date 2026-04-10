import { useEffect, type ReactNode } from "react";

function getPreferredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute("data-theme", getPreferredTheme());
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return <>{children}</>;
}
