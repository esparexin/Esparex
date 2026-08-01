import type { Config } from 'tailwindcss';

// We can optionally import the tokens directly if we want to programmatically inject them, 
// but for NativeWind we usually just extend the theme. 
// For this package, we'll keep it simple.

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      }
    }
  },
  plugins: [],
};

export default config;
