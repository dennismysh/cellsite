import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--color-base) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-blog": "rgb(var(--color-accent-blog) / <alpha-value>)",
        "accent-gallery": "rgb(var(--color-accent-gallery) / <alpha-value>)",
        "accent-audio": "rgb(var(--color-accent-audio) / <alpha-value>)",
        "accent-document": "rgb(var(--color-accent-document) / <alpha-value>)",
        "accent-presentation": "rgb(var(--color-accent-presentation) / <alpha-value>)",
        "accent-external": "rgb(var(--color-accent-external) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "-apple-system", "sans-serif"],
        jp: ['"Noto Serif JP"', "Segoe UI", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
