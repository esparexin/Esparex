import type { Config } from 'tailwindcss';
import { base } from '@esparex/design-tokens';

const config: Config = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: base.brand,
        slate: base.slate,
      }
    }
  },
  plugins: [],
};

export default config;

