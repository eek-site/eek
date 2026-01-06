import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Eek Mechanical brand orange
        orange: {
          DEFAULT: '#ff5500',
          dark: '#e64a00',
          light: '#ff7733',
        },
        // Keep red as alias for easier migration
        red: {
          DEFAULT: '#ff5500',
          dark: '#e64a00',
        },
        zinc: {
          400: '#A3A3A3',
          500: '#71717A',
          600: '#52525B',
          800: '#27272A',
          900: '#18181B',
        }
      },
    },
  },
  plugins: [],
}
export default config
