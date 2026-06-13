/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F5F5F5',
          100: '#E8E8E8',
          200: '#D0D0D0',
          300: '#B0B0B0',
          400: '#888888',
          500: '#555555',
          600: '#2C2C2C',
          700: '#1A1A1A',
          800: '#111111',
          900: '#0A0A0A',
        },
        gold: {
          100: '#FDF6E3',
          400: '#C9A84C',
          500: '#B8960C',
          600: '#9A7D0A',
        },
        success: { 500: '#1A7A4A', 100: '#D4EDDA' },
        warning: { 500: '#E67E22', 100: '#FFF3CD' },
        danger:  { 500: '#C0392B', 100: '#F8D7DA' },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      }
    }
  },
  plugins: []
};
