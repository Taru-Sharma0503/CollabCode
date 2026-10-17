/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#101827',
          card: '#182438',
          editor: '#0B1220'
        },
        border: {
          DEFAULT: '#334155',
          hover: '#26364D'
        },
        text: {
          main: '#F1F5F9',
          muted: '#94A3B8'
        },
        accent: {
          DEFAULT: '#6C8CFF',
          hover: '#5a78ea'
        },
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171'
      },
      borderRadius: {
        surface: '10px'
      }
    },
  },
  plugins: [],
}
