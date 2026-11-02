/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./popup.tsx",
    "./sidepanel.tsx",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        warm: {
          50: "#FDFBF7",   // page background
          100: "#FAF6EF",  // cards
          200: "#F3EDE3",  // subtle surfaces
        },
        stone: {
          200: "#E7E2D9",  // borders
          400: "#A39E94",  // muted text
          600: "#6B675E",  // secondary text
          900: "#1F1D19",  // primary text
        },
        brand: {
          50: "#FFF4EC",
          400: "#FB923C",
          500: "#F97316",  // primary orange
          600: "#EA580C",  // hover / emphasis
        },
      },
      borderRadius: {
        lg: "14px",
        md: "10px",
        sm: "8px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,29,25,0.04), 0 4px 12px rgba(31,29,25,0.05)",
      },
    },
  },
  plugins: [],
}