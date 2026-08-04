import type { Config } from "tailwindcss";

// Color tokens are CSS custom properties (see app/globals.css) so light/dark
// values swap in one place. Values and roles come from the shared dataviz
// palette: status colors (severity) are the fixed good/warning/serious/
// critical steps, never reused for anything else; everything else is
// chart-chrome/ink roles from the same reference palette.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--surface-1)",
        "surface-raised": "var(--surface-raised)",
        plane: "var(--plane)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--border)",
        gridline: "var(--gridline)",
        severity: {
          critical: "var(--severity-critical)",
          high: "var(--severity-high)",
          medium: "var(--severity-medium)",
          low: "var(--severity-low)",
          info: "var(--severity-info)",
        },
        accent: {
          1: "var(--series-1)",
          2: "var(--series-2)",
          3: "var(--series-3)",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
