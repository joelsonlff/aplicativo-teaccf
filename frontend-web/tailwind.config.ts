import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8B1C2C',
          dark: '#6A1420',
          gold: '#C8902E',
          'gold-light': '#E8B84E',
        },
        primary: {
          DEFAULT: '#4A90A4',
          light: '#7AB8C8',
          dark: '#2D6B7F',
        },
        secondary: {
          DEFAULT: '#7CB87C',
          light: '#A8D5A2',
        },
        background: '#F8F6F2',
        surface: '#FFFFFF',
        border: '#E2DDD8',
        warning: '#E8A84E',
        danger: '#D96B6B',
        success: '#5BA35B',
        attention: '#D4884A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
    },
  },
  plugins: [],
} satisfies Config
