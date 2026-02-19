import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F5EF',
          100: '#B3E2D1',
          200: '#80CFB3',
          300: '#4DBC95',
          400: '#26AD80',
          500: '#00875A',
          600: '#007A52',
          700: '#006644',
          800: '#005236',
          900: '#003D28',
        },
        accent: {
          50: '#FFF0E8',
          100: '#FFD4BC',
          200: '#FFB890',
          300: '#FF9C64',
          400: '#FF8444',
          500: '#FF6B35',
          600: '#E85E2D',
          700: '#CC4E22',
          800: '#B04018',
          900: '#8A300E',
        },
        danger: {
          500: '#DC2626',
          600: '#B91C1C',
        },
        warning: {
          500: '#F59E0B',
        },
        success: {
          500: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
