
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'radar-bg': '#0F172A',
        'radar-dark': '#020617',
        'radar-black': '#000000',
        'radar-cyan': '#6FFFE9',
        'radar-green': '#4ADE80',
        'radar-blue': '#3B82F6',
        'radar-purple': '#D946EF',
        'radar-teal': '#10706B',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}