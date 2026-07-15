/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#08090c",
          surface: "#11141a",
          border: "#1f2937",
          cyan: "#66fcf1",
          cyanHover: "#4fece1",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          purpleGlow: "rgba(139, 92, 246, 0.15)",
          red: "#ef4444",
          green: "#10b981",
          textMain: "#c5c6c7",
          textBright: "#ffffff",
          textDim: "#6b7280",
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'cyan': '0 0 15px rgba(102, 252, 241, 0.4)',
        'purple': '0 0 15px rgba(139, 92, 246, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
