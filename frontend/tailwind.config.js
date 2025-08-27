/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0e13",
        panel: "#121620",
        card: "#151a26",
        border: "#1f2736",
        accent: "#4da3ff",
      },
    },
  },
  plugins: [],
};
