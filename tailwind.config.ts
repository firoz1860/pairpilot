import type { Config } from "tailwindcss";

/**
 * Design tokens are declared as CSS custom properties in src/app/globals.css
 * and surfaced here so Tailwind utilities stay in sync with the single source
 * of truth. Palette: warm ivory background, deep navy text, coral primary
 * actions, subtle violet accents.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: "var(--color-ivory)",
          deep: "var(--color-ivory-deep)",
        },
        surface: "var(--color-surface)",
        navy: {
          DEFAULT: "var(--color-navy)",
          muted: "var(--color-navy-muted)",
          soft: "var(--color-navy-soft)",
        },
        coral: {
          DEFAULT: "var(--color-coral)",
          dark: "var(--color-coral-dark)",
          soft: "var(--color-coral-soft)",
        },
        violet: {
          DEFAULT: "var(--color-violet)",
          soft: "var(--color-violet-soft)",
        },
        line: "var(--color-border)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(22, 35, 61, 0.04), 0 8px 24px rgba(22, 35, 61, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
