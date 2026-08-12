/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bgDark: '#090d16',
        bgCard: 'rgba(15, 23, 42, 0.65)',
        electricBlue: '#3b82f6',
        electricBlueGlow: 'rgba(59, 130, 246, 0.4)',
        violetAccent: '#8b5cf6',
        cyanAccent: '#06b6d4',
        accentRed: '#ef4444',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
