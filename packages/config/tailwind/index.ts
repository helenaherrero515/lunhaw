import type { Config } from "tailwindcss";

const config: Omit<Config, "content"> = {
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        surface: "var(--surface)",
        muted: "var(--muted)",
        line: "var(--line)",
        primary: {
          DEFAULT: "var(--primary)",
          fg: "var(--on-primary)",
        },
        "button-green": "var(--button-green)",
        lime: {
          DEFAULT: "var(--lime)",
          fg: "var(--on-lime)",
        },
        mint: "var(--mint)",
        leaf: "var(--leaf)",
        band: {
          DEFAULT: "var(--band)",
          fg: "var(--on-band)",
          muted: "var(--band-muted)",
        },
        mintband: "var(--mintband)",
        chip: "var(--chip)",
        footer: {
          DEFAULT: "var(--foot)",
          fg: "var(--on-foot)",
          muted: "var(--foot-muted)",
        },
        amber: {
          bg: "var(--amber-bg)",
          line: "var(--amber-line)",
          fg: "var(--amber-fg)",
        },
      },
      fontFamily: {
        ui: ["var(--font-ui)", "'Kufam'", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-display)", "'MedievalSharp'", "cursive", "Georgia", "serif"],
        kufam: ["'Kufam'", "system-ui", "-apple-system", "sans-serif"],
        medievalsharp: ["'MedievalSharp'", "cursive", "Georgia", "serif"],
      },
      borderRadius: {
        card: "28px",
        "card-sm": "24px",
        "card-lg": "32px",
        pill: "9999px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
