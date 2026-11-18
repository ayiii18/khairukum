/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8C6D46', // Warm desert bronze/beige
          dark: '#1F2428',    // Deep Charcoal Slate Gray
          light: '#A8895E',   // Warm camel sand
          hover: '#735632',
        },
        beige: {
          50: '#FAF8F5',
          100: '#F4EFE6',
          200: '#EAE2D5',
          300: '#DDD3C1',
          400: '#C7B69D',
          500: '#AD987B',
          600: '#8C775B',
          700: '#6E5D47',
          800: '#4E4233',
          900: '#332A20',
        },
        charcoal: {
          50: '#F6F8FA',
          100: '#EAEFF2',
          200: '#D8E0E6',
          300: '#AFBCC7',
          400: '#768390',
          500: '#57606A',
          600: '#444C56',
          700: '#32383F',
          800: '#24292F',
          900: '#1A1E22',
        },
        accent: {
          DEFAULT: '#B38E5D', // Warm heritage gold-beige
          hover: '#9C784C',
          light: '#F5EFE6',
          dark: '#1F2428',
        },
        neutral: {
          DEFAULT: '#D5CDC2', // Warm neutral border
          light: '#F7F4EE',   // Ivory beige canvas
          white: '#FCFBF9',   // Warm pure card surface
          dark: '#24292F',
        },
        semantic: {
          success: '#15803D',
          warning: '#B45309',
          error: '#B91C1C',
          info: '#4B5563',
        }
      },
      fontFamily: {
        sans: ['var(--font-cairo)', '"Cairo"', '"Tajawal"', 'sans-serif'],
        quran: ['var(--font-amiri-quran)', '"Amiri Quran"', 'var(--font-amiri)', '"Amiri"', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 12px -2px rgba(36, 41, 47, 0.05), 0 2px 6px -1px rgba(36, 41, 47, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(36, 41, 47, 0.08), 0 8px 10px -6px rgba(36, 41, 47, 0.04)',
      }
    },
  },
  plugins: [
    require('tailwindcss-logical'),
  ],
};
