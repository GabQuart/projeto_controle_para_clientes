/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Cores mapeadas para CSS variables — suportam modificadores de opacidade (ex: text-ink/50)
      colors: {
        ink:    'rgb(var(--color-ink)    / <alpha-value>)',
        mist:   'rgb(var(--color-mist)   / <alpha-value>)',
        amber:  'rgb(var(--color-accent) / <alpha-value>)',
        pine:   'rgb(var(--color-pine)   / <alpha-value>)',
        clay:   'rgb(var(--color-clay)   / <alpha-value>)',
        steel:  'rgb(var(--color-steel)  / <alpha-value>)',
        night:  'rgb(var(--color-night)  / <alpha-value>)',
        slate:  'rgb(var(--color-slate)  / <alpha-value>)',
        cobalt: 'rgb(var(--color-cobalt) / <alpha-value>)',
      },
      boxShadow: {
        panel: 'var(--shadow-glow)',
        soft:  '0 12px 32px rgba(53, 149, 193, 0.12)',
      },
      fontFamily: {
        sans:    ['var(--font-sora)', '"Segoe UI"', 'sans-serif'],
        display: ['var(--font-oxanium)', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
