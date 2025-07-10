/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        genfuze: {
          green: '#00FF41',
          black: '#101010',
          dark: '#181818',
          gray: '#232323',
          white: '#FFFFFF',
        },
        primary: '#00FF41',
        background: '#101010',
        card: '#181818',
        accent: '#232323',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
