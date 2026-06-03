import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        widget: "var(--widget)",
        outline: "var(--outline)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          hover: "var(--secondary-hover)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        'surface-0': "var(--surface-0)",
        'surface-1': "var(--surface-1)",
        'surface-2': "var(--surface-2)",
      },
      borderRadius: {
        'card': 'var(--border-radius-card)',
        'element': 'var(--border-radius-element)',
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        hanken: ["var(--font-hanken)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeInUp: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }
    },
  },
  plugins: [],
};
export default config;

