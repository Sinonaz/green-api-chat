/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        telegram: {
          blue: '#2481cc',
          'blue-hover': '#1e72b6',
          'blue-light': '#54a9eb',
          bg: '#0f172a',
          'chat-bg': '#0e1621',
          'sidebar-bg': '#17212b',
          'sidebar-hover': '#202b36',
          'sidebar-active': '#2b5278',
          'bubble-in': '#182533',
          'bubble-out': '#2b5278',
          'text-muted': '#7f91a4',
          'border': '#101921',
          'input-bg': '#17212b',
        }
      }
    },
  },
  plugins: [],
}
