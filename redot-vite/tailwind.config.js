/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}", "./index.html"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        warm: { 50: "#FDFBF7", 100: "#FAF6EF", 200: "#F3EDE3" },
        stone: { 200: "#E7E2D9", 400: "#A39E94", 600: "#6B675E", 900: "#1F1D19" },
        brand: { 50: "#FFF4EC", 400: "#FB923C", 500: "#F97316", 600: "#EA580C" },
      },
      borderRadius: { lg: "14px", md: "10px", sm: "8px" },
      boxShadow: {
        soft: "0 1px 2px rgba(31,29,25,0.04), 0 4px 12px rgba(31,29,25,0.05)",
      },
    },
  },
  plugins: [],
}