/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        java: {
          50: '#effcfc',
          100: '#d7f5f6',
          200: '#b4ebed',
          300: '#80dce0',
          400: '#3fc1c9',
          500: '#2aa7b0',
          600: '#258795',
          700: '#246d7a',
          800: '#265a64',
          900: '#234c56',
          950: '#12323a',
        },
        teal: '#3fc1c9', /* Keeping for backward compatibility, points to java-400 */
        charcoal: '#265a64', /* Updated to java-800 */
        'soft-pink': '#d7f5f6', /* Updated to java-100 */
        gold: '#2aa7b0', /* Updated to java-500 */
      },
      fontFamily: {
        logo: ['CustomScript', 'cursive'],
        heading: ['Roboto Slab', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
        slideDown: 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
}