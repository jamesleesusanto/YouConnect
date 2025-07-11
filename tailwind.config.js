/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // add other folders like "./src/**/*.{js,ts,jsx,tsx}" if needed
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Segoe UI',
          'Arial',
          'Helvetica Neue',
          'Helvetica',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
