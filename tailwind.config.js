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
        ink: '#11212d',
        mist: '#f4efe6',
        amber: '#bf6f2f',
        pine: '#3f6c51',
        clay: '#b24a38',
        steel: '#6c7d90',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(17, 33, 45, 0.12)',
      },
      backgroundImage: {
        'catalog-grid': 'radial-gradient(circle at top left, rgba(191,111,47,0.16), transparent 30%), linear-gradient(135deg, rgba(17,33,45,0.06), transparent 45%)',
      },
      fontFamily: {
        sans: ['"Segoe UI"', '"Trebuchet MS"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
