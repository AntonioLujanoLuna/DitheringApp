// tailwind.config.js
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#f0f7ff',
            100: '#e0effe',
            200: '#baddfd',
            300: '#7bc0fb',
            400: '#3aa3f7',
            500: '#0f8aed',
            600: '#0070cc',
            700: '#005aa3',
            800: '#00487f',
            900: '#003156',
            950: '#00223d',
          },
          accent: {
            300: '#ffd073',
            400: '#ffb347',
            500: '#ff9800',
            600: '#e68200',
            700: '#cc7000',
          }
        },
        animation: {
          'fade-in': 'fadeIn 0.2s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
        },
      },
    },
    plugins: [],
  }