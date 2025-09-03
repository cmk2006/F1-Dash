/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          red: '#e10600',
          black: '#15151e',
          gray: '#6f6f6f',
          yellow: '#f7d117'
        }
      }
    },
  },
  plugins: [],
}
