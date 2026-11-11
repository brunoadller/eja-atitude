/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
        },
        accent: {
          DEFAULT: '#4f46e5',
          soft: '#eef2ff',
        },
      },
      boxShadow: {
        soft: '0 4px 12px rgba(15,23,42,.06)',
        lg2: '0 12px 40px rgba(15,23,42,.1)',
      },
      borderRadius: {
        xl2: '12px',
      },
    },
  },
  plugins: [],
};
