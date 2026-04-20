/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        accent: "#F97316",
      },
      borderRadius: {
        DEFAULT: "12px",
        lg: "16px",
      }
    },
  },
  plugins: [],
}
