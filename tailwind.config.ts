import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#06110c",
          900: "#0a1f14",
          800: "#0f2e1c",
          700: "#164227",
        },
        brand: {
          50: "#eafff2",
          100: "#c7ffdf",
          300: "#6df5ad",
          500: "#17c964",
          600: "#0fa952",
          700: "#0c8542",
        },
        live: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
