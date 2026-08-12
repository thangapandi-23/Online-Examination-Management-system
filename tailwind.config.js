/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#4CAF50',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        sidebar: '#1E293B',
        surface: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(0,0,0,0.07)',
        'card-hover': '0 8px 24px 0 rgba(0,0,0,0.12)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
