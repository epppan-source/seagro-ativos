import type { Config } from "tailwindcss"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta oficial SEAGRO (skill seagro-brand, confirmada 13/08/2026)
        seagro: { dark: "#00402F", DEFAULT: "#007050", light: "#3DA77E" },
        "seagro-agua": "#1583A6",
        "seagro-ambar": "#C8862B",
        "seagro-texto": "#1A1A1A",
        "seagro-cinza": "#6B7672",
        "seagro-prata": "#BCBDC1",
        "seagro-linha": "#E2E5E4",
        "seagro-fundo": "#F4F6F5",
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
