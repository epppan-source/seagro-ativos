import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        seagro: { dark: "#1B5E20", DEFAULT: "#2E7D32", light: "#4CAF50" },
      },
    },
  },
  plugins: [],
}
export default config
