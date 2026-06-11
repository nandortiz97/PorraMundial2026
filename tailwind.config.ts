import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#f8fafc", // Slate-50
        },
        foreground: {
          DEFAULT: "#0f172a", // Slate-900
        },
        brand: {
          slate50: "#f8fafc",
          slate900: "#0f172a",
          emerald600: "#059669",
          amber500: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
