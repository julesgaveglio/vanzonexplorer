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
        // Backgrounds — thème blanc
        "bg-primary": "#FFFFFF",
        "bg-secondary": "#F8FAFC",
        "bg-elevated": "#F1F5F9",
        "bg-subtle": "#E2E8F0",
        // Accents
        "accent-blue": "#3B82F6",
        "accent-teal": "#0EA5E9",
        "accent-gold": "#F59E0B",
        "accent-green": "#10B981",
        // Texte
        "text-primary": "#0F172A",
        "text-secondary": "#334155",
        "text-muted": "#64748B",
        "text-light": "#94A3B8",
        // Bordures
        "border-default": "rgba(0,0,0,0.06)",
        "border-glass": "rgba(255,255,255,0.70)",
        "border-active": "rgba(59,130,246,0.40)",
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
      },
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
export default config;
