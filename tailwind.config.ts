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
    },
  },
  plugins: [],
};
export default config;
