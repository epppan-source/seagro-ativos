import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        seagro: { dark: "#0d3d2e", DEFAULT: "#2E7D32", light: "#4CAF50" },
      },
      fontFamily: {
        sans: ["var(--font-opensans)", "ui-sans-serif", "system-ui"],
        heading: ["var(--font-montserrat)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
}
export default config
