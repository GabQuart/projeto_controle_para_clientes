/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#eef8ff',
        mist: '#0e2239',
        amber: '#58c8ff',
        pine: '#4be0cc',
        clay: '#ff6b87',
        steel: '#88a4c5',
        night: '#050c15',
        slate: '#0a1524',
        cobalt: '#2d7cff',
      },
      boxShadow: {
        panel: '0 18px 60px rgba(1, 121, 255, 0.16)',
        soft: '0 12px 32px rgba(1, 121, 255, 0.12)',
      },
      backgroundImage: {
        'catalog-grid':
          'radial-gradient(circle at 20% 0%, rgba(88,200,255,0.2), transparent 28%), radial-gradient(circle at 80% 12%, rgba(45,124,255,0.24), transparent 25%), linear-gradient(180deg, #050c15 0%, #09111c 44%, #040913 100%)',
      },
      fontFamily: {
        sans: ['var(--font-sora)', '"Segoe UI"', 'sans-serif'],
        display: ['var(--font-oxanium)', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
