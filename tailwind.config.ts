import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Site principal — thème blanc ──────────────────
        "bg-primary": "#FFFFFF",
        "bg-secondary": "#F8FAFC",
        "bg-elevated": "#F1F5F9",
        "bg-subtle": "#E2E8F0",
        "accent-blue": "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-teal": "rgb(var(--accent-soft-rgb) / <alpha-value>)",
        "accent-gold": "rgb(var(--gold-rgb) / <alpha-value>)",
        "accent-green": "#10B981",
        "text-primary": "#0F172A",
        "text-secondary": "#334155",
        "text-muted": "#64748B",
        "text-light": "#94A3B8",
        "border-default": "rgba(0,0,0,0.06)",
        "border-glass": "rgba(255,255,255,0.70)",
        "border-active": "rgba(59,130,246,0.40)",
        // ── Club Privé — thème violet ──────────────────────
        cream: "#FAF7F2",
        earth: {
          DEFAULT: "#1C0A35",
          light: "#2A1050",
        },
        rust: {
          DEFAULT: "#883AE2",
          light: "#8A80E9",
          dark: "#6B28BB",
        },
        sage: {
          DEFAULT: "#8A80E9",
          light: "#F0E9FD",
          dark: "#883AE2",
        },
        muted: {
          DEFAULT: "#8C8070",
          light: "#A89C8E",
          dark: "#6E6458",
        },
        border: "hsl(var(--club-border))",
      },
      backdropBlur: {
        glass: "20px",
        heavy: "40px",
      },
      boxShadow: {
        glass:
          "0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.90)",
        "glass-hover":
          "0 8px 40px rgba(59,130,246,0.10), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)",
      },
      borderRadius: {
        glass: "20px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        heading: ["var(--font-heading)", "Georgia", "serif"],
        display: ["var(--font-heading)", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
