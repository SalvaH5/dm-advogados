/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF0FA',
          100: '#D6E0F5',
          500: '#2E6DA4',
          600: '#1B3A5C',
          700: '#152E4A',
          900: '#0D1E30',
        },
        success: { 500: '#1A7A4A', 100: '#D4EDDA' },
        warning: { 500: '#E67E22', 100: '#FFF3CD' },
        danger:  { 500: '#C0392B', 100: '#F8D7DA' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
};
