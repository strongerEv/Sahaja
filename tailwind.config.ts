import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF8F3',
        ink: '#2C2622',
        muted: '#7A6E64',
        line: '#E8E0D5',
        brand: {
          50: '#F7F3EE',
          100: '#EDE3D7',
          200: '#DCC7AF',
          300: '#C9A882',
          400: '#B98E5F',
          500: '#A6753F',
          600: '#8A5F33',
          700: '#6C4A28',
          800: '#4E361D',
          900: '#332312',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .7s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
