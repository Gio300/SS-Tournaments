import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0E14',
        panel: '#141824',
        accent: '#E10600',
        'accent-secondary': '#FF8C00',
        'text-primary': '#F5F7FA',
        'text-muted': '#9AA4B2',
        border: '#2A2F45',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-orbitron)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
