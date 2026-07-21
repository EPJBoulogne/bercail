import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        paper: "#EEF0F3",
        accent: "#FF5E5B",
        "accent-soft": "#FFE6E5",
        gold: "#F3C677",
        "gold-soft": "#FDF3E2",
        success: "#1F9D67",
        danger: "#D64545",
        warning: "#C98A1F",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;