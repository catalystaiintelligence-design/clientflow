/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EAF3FB',
          100: '#C7E0F4',
          200: '#9DC3E8',
          300: '#6DA5DA',
          400: '#3D88CE',
          500: '#0176D3',
          600: '#0165B9',
          700: '#014486',
          800: '#023265',
          900: '#032D60',
        },
        sf: {
          navy:    '#032D60',
          blue:    '#0176D3',
          cloud:   '#1B96FF',
          slate:   '#444444',
          neutral: '#F3F2F2',
          border:  '#DDDBDA',
          muted:   '#706E6B',
          success: '#2E844A',
          warning: '#FE9339',
          error:   '#BA0517',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Salesforce Sans', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12)',
        elevated: '0 8px 24px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
