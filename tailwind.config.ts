import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        serif: ['"Playfair Display"', "serif"],
        cursive: ["var(--font-caveat)", "cursive"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        modash: {
          pink: "#FF6B9C", // Modash-like pink
          purple: "#9F7AEA", // Modash-like purple
          dark: "#050505",
          gray: "#1F1F1F",
        }
      },
      animation: {
        blob: "blob 7s infinite",
        "text-shimmer": "text-shimmer 2.5s ease-out infinite alternate",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
