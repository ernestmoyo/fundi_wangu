import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F5EF',
          100: '#B3E2D1',
          500: '#00875A',
          600: '#007A52',
          700: '#006644',
        },
        accent: {
          500: '#FF6B35',
          600: '#E85E2D',
        },
      },
    },
  },
  plugins: [],
};

export default config;
