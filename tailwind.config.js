/** @type {import('tailwindcss').Config} */
const { addDynamicIconSelectors } = require('@iconify/tailwind');
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-heading)'],
        title: ['var(--font-title)'],
        ic: ['ic', 'sans-serif'],
        posts: ['var(--font-posts)'],
      },
      screens: {
        'mobile-smallest': '413px',
        'mobile-small': '567px',
        'mobile': '767px',
        'tablet-mobile': '767px',
        'tablet': '768px',
        'tablet-desktop': '1024px',
        'desktop': '1280px',
        'desktop-large': '1440px',
        'desktop-largest': '1920px',
      },
      animation: {
        'slide-up-big-in': 'slide-up-big-in 0.5s ease-out',
        'slide-down-in': 'slide-down-in 0.5s ease-out',
      },
      keyframes: {
        'slide-up-big-in': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down-in': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    addDynamicIconSelectors(),
    function({ addUtilities }) {
      addUtilities({
        '.text-shadow-none': {
          'text-shadow': 'none',
        },
      });
    },
  ],
  safelist: [
    "prose-sm",
    "prose-base",
    "prose-lg",
    "prose-xl",
    "prose-2xl",
    "prose-gray",
    "prose-slate",
    "prose-zinc",
    "prose-neutral",
    "prose-stone",
  ],
};
