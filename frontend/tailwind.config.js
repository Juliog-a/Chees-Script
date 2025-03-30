/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./base.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../backend/templates/**/*.html"        // Asegura que Tailwind escanea los archivos Django
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: false,
};
