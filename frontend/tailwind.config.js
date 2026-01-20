/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Space theme colors
        void: '#0a0a0f',
        nebula: {
          50: '#f0e7ff',
          100: '#d4bdff',
          200: '#b794ff',
          300: '#9b6bff',
          400: '#7e42ff',
          500: '#6219ff',
          600: '#4c00e6',
          700: '#3700b3',
          800: '#230080',
          900: '#10004d',
        },
        plasma: {
          50: '#e0f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd4ff',
          400: '#1ac8ff',
          500: '#00b8e6',
          600: '#0090b3',
          700: '#006880',
          800: '#00404d',
          900: '#00181a',
        },
        energy: {
          50: '#e6fff0',
          100: '#b3ffd6',
          200: '#80ffbb',
          300: '#4dffa1',
          400: '#1aff86',
          500: '#00e66c',
          600: '#00b354',
          700: '#00803c',
          800: '#004d24',
          900: '#001a0c',
        },
        iron: '#8b8b8b',
        deuterium: '#4a90d9',
        crystals: '#9b59b6',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        body: ['Exo 2', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'warp': 'warp 0.5s ease-out',
        'scan': 'scan 2s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'energy-flow': 'energy-flow 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(98, 25, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(98, 25, 255, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        warp: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
          '100%': { transform: 'scale(0)', opacity: '0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'energy-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'space-grid': 'linear-gradient(rgba(98, 25, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(98, 25, 255, 0.1) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};
