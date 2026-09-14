import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        legal: {
          dark: "#0a0f1d",
          card: "#111827",
          border: "#1f2937",
          accent: "#4f46e5",
          highlight: "#6366f1",
        },
      },
    },
  },
  plugins: [],
};

export default config;
