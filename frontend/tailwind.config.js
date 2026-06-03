/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a08',
        surface:    '#12120e',
        border: {
          DEFAULT: '#2c3322',
          light:   '#3e4732',
        },
        precision: {
          pink:   '#E83A82',
          green:  '#4ade80',
          olive:  '#353A2C',
          cyan:   '#38bdf8',
          purple: '#c084fc',
          yellow: '#facc15',
          darkBg: '#11120f',
        },
        neon: {
          green:  '#4ade80',
          pink:   '#E83A82',
          violet: '#c084fc',
          cyan:   '#38bdf8',
        }
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        button:  ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        xl:  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'spin-slow':   'spin 8s linear infinite',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':       'float 6s ease-in-out infinite',
        'gradient':    'gradient 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
  // Prefix all Tailwind classes with `tw-` to avoid collision with existing app styles
  prefix: '',
  // Only apply preflight to the landing page wrapper
  corePlugins: {
    preflight: false,
  },
}
