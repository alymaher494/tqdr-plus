import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f4f7f6',
          100: '#e9efed',
          200: '#c8d7d1',
          300: '#a7bfb5',
          400: '#86a79a',
          500: '#558A78', // Requested Brand Green
          600: '#4c7c6c',
          700: '#436e60',
          800: '#3a6054',
          900: '#315248',
        },
        emerald: {
          50:  '#f4f7f6',
          100: '#e9efed',
          200: '#c8d7d1',
          300: '#a7bfb5',
          400: '#86a79a',
          500: '#558A78',
          600: '#4c7c6c',
          700: '#436e60',
          800: '#3a6054',
          900: '#315248',
        },
        green: {
          50:  '#f4f7f6',
          100: '#e9efed',
          200: '#c8d7d1',
          300: '#a7bfb5',
          400: '#86a79a',
          500: '#558A78',
          600: '#4c7c6c',
          700: '#436e60',
          800: '#3a6054',
          900: '#315248',
        },
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
    },
  },
} satisfies Config
