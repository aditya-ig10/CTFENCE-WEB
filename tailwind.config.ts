import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--void)",
        surface: "var(--surface)",
        borderc: "var(--border)",
        dim: "var(--dim)",
        muted: "var(--muted)",
        textc: "var(--text)",
        bright: "var(--bright)",
        accent: "var(--accent)",
        accentDim: "var(--accent-dim)",
        warn: "var(--warn)",
        info: "var(--info)",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
        display: ["'Space Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;