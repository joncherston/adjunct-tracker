/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        suscc: {
          blue: {
            DEFAULT: '#10069F',
            dark: '#030F3C',
            light: '#1D3D71',
          },
          gold: {
            DEFAULT: '#FFCD00',
            light: '#FBF1BF',
            dark: '#EFB239',
          }
        },
        success: '#27AE60',
        danger: '#E74C3C',
        warning: '#FFCD00',
      },
      fontFamily: {
        sans: ['Montserrat', 'Century Gothic', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
