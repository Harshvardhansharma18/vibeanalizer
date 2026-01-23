/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vibe-dark': '#0a0a0a',
        'vibe-neon': '#ccff00',
        'vibe-purple': '#bd00ff',
        'vibe-gray': '#1a1a1a'
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', 'monospace'],
        'sans': ['"Inter"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
