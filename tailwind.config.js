/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e6f7fd",
          100: "#b3e8f9",
          400: "#38bce8",
          500: "#1AABDC",
          600: "#1A9FD4",
          700: "#1480aa",
          900: "#0a4f6b",
        },
        sidebar:      "#1C1C2E",
        "sidebar-dark": "#1A1D27",
      },
    },
  },
  plugins: [],
};