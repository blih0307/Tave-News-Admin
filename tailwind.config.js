export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sports: { primary: '#FFD600', dark: '#111111' },
        news: { primary: '#111111', dark: '#0A0A0A' },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
