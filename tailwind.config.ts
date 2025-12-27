import { type Config } from "tailwindcss";
import * as tail from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...tail.default.fontFamily.sans],
      },
      colors: {
        primary: "#a30d0d",
        secondary: "#bb8377",
        sand: "#fff4ef",
        plum: "#582b39",
        ink: "#1b0b0d",
      },
    },
  },
  plugins: [],
} satisfies Config;
