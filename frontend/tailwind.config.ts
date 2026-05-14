import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1b2a4a',
          light: '#243560',
          dark: '#131e35',
        },
        gold: {
          DEFAULT: '#c9a84c',
          hover: '#b8933d',
          light: '#e8d49a',
        },
        cream: {
          DEFAULT: '#f5f3ee',
          dark: '#ede9e0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
